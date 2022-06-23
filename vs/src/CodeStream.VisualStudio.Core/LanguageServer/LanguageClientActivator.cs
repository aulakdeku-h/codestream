﻿using CodeStream.VisualStudio.Core.Logging;
using EnvDTE;
using Microsoft.VisualStudio.Shell;
using Serilog;
using System;
using System.IO;
using System.Threading.Tasks;
using CSConstants = CodeStream.VisualStudio.Framework.Constants;

namespace CodeStream.VisualStudio.Core.LanguageServer {
	public class LanguageClientActivatorDummy { }
	public static class LanguageClientActivator {
		private static readonly ILogger Log = LogManager.ForContext<LanguageClientActivatorDummy>();
		public static async Task<bool?> ActivateAsync(DTE dte) {
			if (dte == null) return false;

			string path = null;
			try {
				await ThreadHelper.JoinableTaskFactory.SwitchToMainThreadAsync();
				path = Path.Combine(Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location), "Resources", CSConstants.CodeStreamCodeStream);

				var window = dte.OpenFile(Constants.vsViewKindCode, path);
				window.Visible = true;
				window.Close(vsSaveChanges.vsSaveChangesNo);
				Log.Debug($"{nameof(ActivateAsync)} success for {path}");
				return true;
			}
			catch (ArgumentNullException ex) {
				Log.Warning(ex, $"{nameof(ActivateAsync)} failed for {path}");
				return false;
			}
			catch (Exception ex) {
				Log.Error(ex, $"{nameof(ActivateAsync)} failed for {path}");
				return false;
			}
		}
	}
}
