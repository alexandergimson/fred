// prospect_main.jsx
import { useMemo, useEffect } from "react";
import PdfFlipBook from "./PdfFlipBook";
import { trackContentView } from "./lib/track";

// Converts a share URL (YouTube, Vimeo, Loom, Google Drive) into an embeddable iframe src
function toEmbed(url, title = "Embed") {
  if (!url || typeof url !== "string") return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

    // YouTube variants…
    if (
      host === "youtube.com" ||
      host === "youtube-nocookie.com" ||
      host === "youtu.be"
    ) {
      let id = "";
      if (host === "youtu.be") {
        id = u.pathname.split("/")[1] || "";
      } else if (u.pathname.startsWith("/shorts/")) {
        id = u.pathname.split("/")[2] || "";
      } else {
        id = u.searchParams.get("v") || "";
      }
      if (!id) return null;
      const t = u.searchParams.get("t") || u.searchParams.get("start");
      const start = t && /^\d+$/.test(t) ? `?start=${t}` : "";
      const src = `https://www.youtube-nocookie.com/embed/${id}${start}`;
      return {
        src,
        title,
        allow:
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        allowFullScreen: true,
        referrerPolicy: "strict-origin-when-cross-origin",
      };
    }

    // Vimeo
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      let id = "";
      const parts = u.pathname.split("/").filter(Boolean);
      if (host === "player.vimeo.com") {
        id = parts[1] || "";
      } else {
        id = parts[0] || "";
      }
      if (!id) return null;
      return {
        src: `https://player.vimeo.com/video/${id}`,
        title,
        allow: "autoplay; fullscreen; picture-in-picture",
        allowFullScreen: true,
        referrerPolicy: "strict-origin-when-cross-origin",
      };
    }

    // Loom
    if (host.endsWith("loom.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[1] || ""; // share/ID
      if (!id) return null;
      return {
        src: `https://www.loom.com/embed/${id}`,
        title,
        allow: "autoplay; clipboard-write; encrypted-media; picture-in-picture",
        allowFullScreen: true,
        referrerPolicy: "strict-origin-when-cross-origin",
      };
    }

    // Google Drive
    if (host === "drive.google.com") {
      const match = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = match?.[1];
      if (!id) return null;
      return {
        src: `https://drive.google.com/file/d/${id}/preview`,
        title,
        allow: "autoplay; clipboard-write; encrypted-media; picture-in-picture",
        allowFullScreen: true,
        referrerPolicy: "strict-origin-when-cross-origin",
      };
    }

    // Fallback
    return { src: u.toString(), title, allowFullScreen: true };
  } catch (e) {
    return null;
  }
}

export default function ProspectMain({ content, onMeasure, hubId, shareId }) {
  // Track views whenever active content changes
  useEffect(() => {
    if (hubId && content?.id) {
      trackContentView({
        hubId,
        shareId: shareId ?? null,
        contentId: content.id,
      });
    }
  }, [hubId, shareId, content?.id]);

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

  const renderEmbed = () => {
    if (!content?.embedUrl) {
      return <div className="p-6 text-gray-600">No embed URL.</div>;
    }
    const embed = toEmbed(content.embedUrl, content.name || "Embed");
    if (!embed) {
      return (
        <div className="p-6 text-gray-600">
          Invalid or unsupported embed URL.
        </div>
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="w-full aspect-video relative">
          <iframe
            src={embed.src}
            title={embed.title}
            className="absolute inset-0 w-full h-full rounded-md shadow"
            allow={embed.allow || undefined}
            allowFullScreen={embed.allowFullScreen}
            referrerPolicy={embed.referrerPolicy || undefined}
          />
        </div>
      </div>
    );
  };

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
    <div className="w-full h-full" style={{ background: "transparent" }}>
      {!content ? (
        <div className="p-6 text-gray-600">No content selected.</div>
      ) : content.kind === "embed" ? (
        renderEmbed()
      ) : isPdf ? (
        <PdfFlipBook
          key={fileUrl}
          url={fileUrl}
          forceTwoUp
          verticalPad={0}
          showInternalArrows={false}
          showCover={false}
          gap={0}
          maxWidth={2200}
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
