using System.Collections.Generic;
using CodeStream.VisualStudio.Framework.Models;

namespace CodeStream.VisualStudio.Framework.Extensions
{
	public static class AbstractMessageTypeExtensions {
		public static string ToLoggableString(this IAbstractMessageType message) {
			return message?.ToLoggableDictionary(null, false).ToKeyValueString();
		}

		public static Dictionary<string, object> ToLoggableDictionary(this IAbstractMessageType message, string name, bool canEnqueue) {
			if (message == null) return null;
			var result = new Dictionary<string, object> { };
			if (name != null) {
				result.Add(nameof(name), name);
			}
			if (!message.Id.IsNullOrWhiteSpace()) {
				result.Add(nameof(message.Id), message.Id);
			}
			if (!message.Method.IsNullOrWhiteSpace()) {
				result.Add(nameof(message.Method), message.Method);
			}
			if (!message.Error.IsNullOrWhiteSpace()) {
				result.Add(nameof(message.Error), message.Error);
			}
			if (canEnqueue) {
				result.Add(nameof(canEnqueue), "true");
			}
			return result;
		}
	}
}
