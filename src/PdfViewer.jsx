// PdfViewer.jsx
export default function PdfViewer({ url }) {
  if (!url) return null;
  return (
    <div className="w-full h-full">
      <iframe
        src={url} // you could append "#view=FitH" or "#zoom=page-width"
        title="PDF"
        className="w-full h-full border-0"
      />
      {/* Fallback link for browsers that block inline PDFs */}
      <noscript />
      <div className="sr-only">
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open PDF
        </a>
      </div>
    </div>
  );
}
