// prospect_main.jsx
import { useMemo } from "react";
import PdfFlipBook from "./PdfFlipBook";

export default function ProspectMain({
  hubTitle,
  content,
  contactHref,
  onMeasure,
}) {
  const fileUrl = content?.fileUrl || "";
  const isPdf = useMemo(
    () => typeof fileUrl === "string" && /\.pdf($|\?)/i.test(fileUrl),
    [fileUrl]
  );
  const isImage = useMemo(
    () =>
      typeof fileUrl === "string" &&
      /\.(png|jpe?g|gif|webp|avif|bmp|svg)($|\?)/i.test(fileUrl),
    [fileUrl]
  );

  const renderEmbed = () =>
    content?.embedUrl ? (
      <iframe
        src={content.embedUrl}
        title={content.name || "Embed"}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    ) : (
      <div className="p-6 text-gray-600">No embed URL.</div>
    );

  const renderImage = () =>
    fileUrl ? (
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={fileUrl}
          alt={content?.name || "Image"}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    ) : (
      <div className="p-6 text-gray-600">No file URL.</div>
    );

  return (
    <div className="w-full h-full">
      {!content ? (
        <div className="p-6 text-gray-600">No content selected.</div>
      ) : content.kind === "embed" ? (
        renderEmbed()
      ) : isPdf ? (
        <PdfFlipBook
          key={fileUrl}
          url={fileUrl}
          forceTwoUp
          verticalPad={0} // ← use full center height
          showInternalArrows={false}
          showCover={false} // open as [1|2]
          gap={0}
          maxWidth={2200} // allow wider spreads if the screen allows
          onMeasure={onMeasure}
        />
      ) : isImage ? (
        renderImage()
      ) : fileUrl ? (
        <div className="p-6">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600"
          >
            Open file
          </a>
        </div>
      ) : (
        <div className="p-6 text-gray-600">Nothing to show.</div>
      )}
    </div>
  );
}
