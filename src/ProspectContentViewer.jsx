// prospect_main.jsx
import { useMemo, useEffect, useState, useCallback } from "react";
import { trackContentView } from "./lib/track";

// Converts a share URL (YouTube, Vimeo, Loom, Google Drive) into an embeddable iframe src
function toEmbed(url, title = "Embed") {
  if (!url || typeof url !== "string") return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

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

    if (host.endsWith("loom.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[1] || "";
      if (!id) return null;
      return {
        src: `https://www.loom.com/embed/${id}`,
        title,
        allow: "autoplay; clipboard-write; encrypted-media; picture-in-picture",
        allowFullScreen: true,
        referrerPolicy: "strict-origin-when-cross-origin",
      };
    }

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

    return { src: u.toString(), title, allowFullScreen: true };
  } catch {
    return null;
  }
}

function ProspectPdfImageViewer({ pages = [], onMeasure }) {
  const safePages = Array.isArray(pages) ? pages : [];
  const [spreadStart, setSpreadStart] = useState(0);
  const [loadedUrls, setLoadedUrls] = useState(() => new Set());

  useEffect(() => {
    setSpreadStart(0);
    setLoadedUrls(new Set());
  }, [pages]);

  const left = safePages[spreadStart] || null;
  const right = safePages[spreadStart + 1] || null;

  const canGoPrev = spreadStart > 0;
  const canGoNext = spreadStart + 2 < safePages.length;

  useEffect(() => {
    if (!left) return;

    const ratio = left.width && left.height ? left.height / left.width : 1.4142;

    const pageHeight = 900;
    const pageWidth = Math.floor(pageHeight / ratio);

    onMeasure?.({
      pageWidth,
      pageHeight,
      bookWidth: right ? pageWidth * 2 : pageWidth,
      bookHeight: pageHeight,
    });
  }, [left, right, onMeasure]);

  useEffect(() => {
    const preload = [safePages[spreadStart + 2], safePages[spreadStart + 3]]
      .filter(Boolean)
      .map((p) => p.url);

    preload.forEach((url) => {
      if (!url || loadedUrls.has(url)) return;
      const img = new Image();
      img.src = url;
      img.onload = () => {
        setLoadedUrls((prev) => {
          const next = new Set(prev);
          next.add(url);
          return next;
        });
      };
    });
  }, [safePages, spreadStart, loadedUrls]);

  const goPrev = useCallback(() => {
    setSpreadStart((s) => Math.max(0, s - 2));
  }, []);

  const goNext = useCallback(() => {
    setSpreadStart((s) => (s + 2 < safePages.length ? s + 2 : s));
  }, [safePages.length]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  if (!left) {
    return (
      <div className="w-full h-full grid place-items-center">
        <div className="text-sm text-gray-500">No preview pages available.</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full h-full flex items-center justify-center relative">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          className="absolute left-4 z-10 px-3 py-2 rounded bg-white/90 shadow disabled:opacity-40"
        >
          Prev
        </button>

        <div className="flex items-center justify-center gap-0 max-w-full max-h-full transition-opacity duration-200">
          <img
            src={left.url}
            alt={`Page ${left.page ?? spreadStart + 1}`}
            className="max-h-full max-w-[50%] object-contain bg-white shadow"
          />
          {right ? (
            <img
              src={right.url}
              alt={`Page ${right.page ?? spreadStart + 2}`}
              className="max-h-full max-w-[50%] object-contain bg-white shadow"
            />
          ) : null}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          className="absolute right-4 z-10 px-3 py-2 rounded bg-white/90 shadow disabled:opacity-40"
        >
          Next
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-600 bg-white/80 rounded px-3 py-1 shadow">
          {right
            ? `${left.page}–${right.page} of ${safePages.length}`
            : `${left.page} of ${safePages.length}`}
        </div>
      </div>
    </div>
  );
}

export default function ProspectMain({ content, onMeasure, hubId, shareId }) {
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
    [fileUrl],
  );
  const isImage = useMemo(
    () =>
      typeof fileUrl === "string" &&
      /\.(png|jpe?g|gif|webp|avif|bmp|svg)($|\?)/i.test(fileUrl),
    [fileUrl],
  );

  const previewPages = Array.isArray(content?.previewPages)
    ? content.previewPages
    : [];
  const hasPreviewPages = previewPages.length > 0;
  const processingStatus = content?.processingStatus || null;

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

  const renderPdf = () => {
    if (hasPreviewPages) {
      return (
        <ProspectPdfImageViewer pages={previewPages} onMeasure={onMeasure} />
      );
    }

    if (processingStatus === "pending" || processingStatus === "processing") {
      return (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-80 h-96 bg-gray-100 rounded-md animate-pulse mx-auto mb-4" />
            <div className="text-sm text-gray-600">
              Preparing document preview…
            </div>
            {fileUrl ? (
              <div className="mt-3">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600"
                >
                  Open original PDF
                </a>
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    if (fileUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-3">
              This document preview is not ready yet.
            </div>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600"
            >
              Open original PDF
            </a>
          </div>
        </div>
      );
    }

    return <div className="p-6 text-gray-600">No file URL.</div>;
  };

  return (
    <div className="w-full h-full" style={{ background: "transparent" }}>
      {!content ? (
        <div className="p-6 text-gray-600">No content selected.</div>
      ) : content.kind === "embed" ? (
        renderEmbed()
      ) : isPdf ? (
        renderPdf()
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
