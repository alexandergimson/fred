export default function PdfViewer({ url }) {
  if (!url) return null;
  return (
    <div className="w-full h-full">
      <iframe src={url} title="PDF" className="w-full h-full border-0" />
      <noscript />
      <div className="sr-only">
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open PDF
        </a>
      </div>
    </div>
  );
}
