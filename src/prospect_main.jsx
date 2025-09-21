// prospect_main.jsx
import { useMemo } from "react";
import ContentLayout from "./ContentLayout";
import PdfViewer from "./PdfViewer";

export default function ProspectMain({ hubTitle, content, contactHref }) {
  const contentName = content?.name ?? "—";
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
      <div className="w-full h-full">
        <iframe
          src={content.embedUrl}
          title={content.name || "Embed"}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    ) : (
      <div className="p-6 text-gray-600">No embed URL.</div>
    );

  const renderImage = () =>
    fileUrl ? (
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={fileUrl}
          alt={content.name || "Image"}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    ) : (
      <div className="p-6 text-gray-600">No file URL.</div>
    );

  return (
    <ContentLayout
      hubTitle={hubTitle}
      contentName={contentName}
      rightSlot={
        contactHref ? (
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-40 h-10 inline-flex items-center justify-center rounded-lg text-base no-underline cursor-pointer transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--pv-btn-bg)",
              color: "var(--pv-btn-text)",
            }}
          >
            Contact Us
          </a>
        ) : null
      }
      // no custom controls — we’re using the browser PDF viewer
      controls={null}
    >
      {!content ? (
        <div className="p-6 text-gray-600">No content selected.</div>
      ) : content.kind === "embed" ? (
        renderEmbed()
      ) : isPdf ? (
        <div className="w-full h-full">
          <PdfViewer url={fileUrl} />
        </div>
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
    </ContentLayout>
  );
}
