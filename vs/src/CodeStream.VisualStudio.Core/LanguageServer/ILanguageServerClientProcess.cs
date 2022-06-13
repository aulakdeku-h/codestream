using CodeStream.VisualStudio.Core.Services;
using CodeStream.VisualStudio.Framework.Interfaces;

namespace CodeStream.VisualStudio.Core.LanguageServer {
	public interface ILanguageServerClientProcess {
		System.Diagnostics.Process Create(ICodeStreamSettingsManager codeStreamSettingsManager, IHttpClientService httpClient);
	}
}
