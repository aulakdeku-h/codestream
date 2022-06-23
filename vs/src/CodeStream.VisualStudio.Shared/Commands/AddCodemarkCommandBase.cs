﻿using CodeStream.VisualStudio.Core;
using CodeStream.VisualStudio.Core.Events;
using CodeStream.VisualStudio.Core.Logging;
using CodeStream.VisualStudio.Core.Models;
using CodeStream.VisualStudio.Core.Packages;
using CodeStream.VisualStudio.Core.Services;
using CodeStream.VisualStudio.Core.Vssdk.Commands;
using Microsoft.VisualStudio.ComponentModelHost;
using Microsoft.VisualStudio.Shell;
using Serilog;
using System;
using System.Threading;
#if X86
using CodeStream.VisualStudio.Vsix.x86;
#endif

namespace CodeStream.VisualStudio.Commands {
	internal abstract class AddCodemarkCommandBase : VsCommandBase {
		private static readonly ILogger Log = LogManager.ForContext<AddCodemarkCommandBase>();
		private readonly ISessionService _sessionService;

		protected AddCodemarkCommandBase(ISessionService sessionService, Guid commandSet, int commandId) : base(commandSet, commandId) {
			_sessionService = sessionService;
		}

		protected abstract CodemarkType CodemarkType { get; }

		protected override void ExecuteUntyped(object parameter) {
			try {
				var componentModel = (IComponentModel)Package.GetGlobalService(typeof(SComponentModel));
				var codeStreamService = componentModel?.GetService<ICodeStreamService>();
				if (codeStreamService == null || !codeStreamService.IsReady) return;

				var editorService = componentModel.GetService<IEditorService>();
				var activeTextEditor = editorService.GetActiveTextEditorSelection();
				if (activeTextEditor == null) return;

				ThreadHelper.JoinableTaskFactory.Run(async delegate {
					await ThreadHelper.JoinableTaskFactory.SwitchToMainThreadAsync();

					try {
						var toolWindowProvider = Package.GetGlobalService(typeof(SToolWindowProvider)) as IToolWindowProvider;
						if (!toolWindowProvider.IsVisible(Guids.WebViewToolWindowGuid)) {
							if (toolWindowProvider?.ShowToolWindowSafe(Guids.WebViewToolWindowGuid) == true) {
							}
							else {
								Log.Warning("Could not activate tool window");
							}
						}

						if (_sessionService.WebViewDidInitialize == true) {
							_ = NewCodemarkCoreAsync(codeStreamService, activeTextEditor);
						}
						else {
							var eventAggregator = componentModel.GetService<IEventAggregator>();
							IDisposable d = null;
							d = eventAggregator.GetEvent<WebviewDidInitializeEvent>().Subscribe(e => {
								try {
									_ = NewCodemarkCoreAsync(codeStreamService, activeTextEditor);
									d.Dispose();
								}
								catch (Exception ex) {
									Log.Error(ex, $"{nameof(AddCodemarkCommandBase)} event");
								}
							});
						}
					}
					catch (Exception ex) {
						Log.Error(ex, nameof(AddCodemarkCommandBase));
					}
				});
			}
			catch (Exception ex) {
				Log.Error(ex, nameof(AddCodemarkCommandBase));
			}
		}

		protected override void OnBeforeQueryStatus(OleMenuCommand sender, EventArgs e) {
			sender.Visible = _sessionService?.IsReady == true;
		}

		private async System.Threading.Tasks.Task NewCodemarkCoreAsync(ICodeStreamService codeStreamService, ActiveTextEditorSelection activeTextEditor) {
			try {
				string source = null;
				if (CommandSet == PackageGuids.guidWebViewPackageCodeWindowContextMenuCmdSet) {
					source = "Context Menu";
				}
				else if (CommandSet == PackageGuids.guidWebViewPackageShortcutCmdSet) {
					source = "Shortcut";
				}

				await codeStreamService.NewCodemarkAsync(activeTextEditor.Uri, activeTextEditor.Range,
					CodemarkType, source,
					cancellationToken: CancellationToken.None);
			}
			catch (Exception ex) {
				Log.Error(ex, nameof(NewCodemarkCoreAsync));
			}
		}
	}
}
