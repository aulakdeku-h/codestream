﻿using CodeStream.VisualStudio.Core.Models;
using Microsoft.VisualStudio.Text.Editor;

namespace CodeStream.VisualStudio.UI.Glyphs
{
    internal class DocumentMarkGlyphTag : IGlyphTag
    {
        public DocumentMarker DocumentMarker { get; }

        public DocumentMarkGlyphTag(DocumentMarker documentMarker)
        {
            DocumentMarker = documentMarker;
        }
    }
}
