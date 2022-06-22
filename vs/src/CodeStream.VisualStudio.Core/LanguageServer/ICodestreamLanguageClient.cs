using System.Threading.Tasks;
using Microsoft.VisualStudio.LanguageServer.Client;

namespace CodeStream.VisualStudio.Core.LanguageServer {
	public interface ICodestreamLanguageClient : ILanguageClient {
		Task RestartAsync();
		Task TryStopAsync();
	}
}
