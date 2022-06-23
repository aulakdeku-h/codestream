﻿using CodeStream.VisualStudio.Framework.Models;

namespace CodeStream.VisualStudio.Core.Models {
	public class WebviewDidInitializeNotificationType : NotificationType<EmptyRequestTypeParams> {
		public const string MethodName = "host/didInitialize";
		public override string Method => MethodName;
	}

	public class WebviewDidChangeContextNotification {
		public WebviewContext Context { get; set; }
	}

	public class WebviewDidChangeContextNotificationType : NotificationType<WebviewDidChangeContextNotification> {
		public const string MethodName = "host/context/didChange";
		public override string Method => MethodName;
	}
}
