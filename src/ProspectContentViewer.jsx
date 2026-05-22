import { useMemo, useEffect, useState, useRef } from "react";
import { trackContentEngagement, trackContentView } from "./lib/track";
import { getThumb } from "./components/hub-experience/utils";
import ContentViewerLayout from "./components/content-viewer/ContentViewerLayout";
import ContentViewerToolbar from "./components/content-viewer/ContentViewerToolbar";
import ContentViewerHero from "./components/content-viewer/ContentViewerHero";
import NextUpSection from "./components/content-viewer/NextUpSection";
import PremiumButton from "./components/PremiumButton";

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

      return {
        src: `https://www.youtube-nocookie.com/embed/${id}${start}`,
        title,
        allow:
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        allowFullScreen: true,
        referrerPolicy: "strict-origin-when-cross-origin",
      };
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = host === "player.vimeo.com" ? parts[1] || "" : parts[0] || "";

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

    return {
      src: u.toString(),
      title,
      allowFullScreen: true,
    };
  } catch {
    return null;
  }
}

function getContentTypeLabel(content, fileUrl) {
  if (content?.kind === "embed") return "Interactive content";
  if (content?.fileMimeType === "application/pdf") return "PDF document";
  if (content?.fileMimeType?.startsWith("image/")) return "Image";
  if (typeof fileUrl === "string" && /\.pdf($|\?)/i.test(fileUrl)) {
    return "PDF document";
  }
  return "Resource";
}
function ProspectPdfImageViewer({ pages = [], onMeasure }) {
  const safePages = useMemo(() => (Array.isArray(pages) ? pages : []), [pages]);
  const pageRefs = useRef([]);
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    pageRefs.current = pageRefs.current.slice(0, safePages.length);
    setActiveIndex(0);
  }, [safePages.length]);

  useEffect(() => {
    const firstPage = safePages[0];

    if (!firstPage) return;

    const ratio =
      firstPage.width && firstPage.height
        ? firstPage.height / firstPage.width
        : 1.4142;

    const pageWidth = 920;
    const pageHeight = Math.floor(pageWidth * ratio);

    onMeasure?.({
      pageWidth,
      pageHeight,
      bookWidth: pageWidth,
      bookHeight: pageHeight,
    });
  }, [safePages, onMeasure]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const index = Number(visible.target.dataset.pageIndex);

        if (!Number.isNaN(index)) {
          setActiveIndex(index);
        }
      },
      {
        root,
        threshold: [0.35, 0.5, 0.7],
      },
    );

    pageRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [safePages.length]);

  function jumpToPage(index) {
    pageRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  if (safePages.length === 0) {
    return (
      <div className="grid min-h-[520px] place-items-center rounded-3xl border border-white/10 bg-white text-sm text-gray-500">
        No preview pages available.
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-transparent">
      {" "}
      <div className="grid h-[calc(100vh-96px)] min-h-[720px] grid-cols-[112px_minmax(0,1fr)]">
        <aside className="px-3 py-4">
          <div className="space-y-3 overflow-y-auto pr-1">
            {safePages.map((page, index) => (
              <button
                key={page.url || index}
                type="button"
                onClick={() => jumpToPage(index)}
                className={[
                  "w-full overflow-hidden rounded-lg border bg-white text-left transition-all",
                  activeIndex === index
                    ? "border-white shadow-lg ring-2 ring-white/30"
                    : "border-white/10 opacity-60 hover:opacity-100",
                ].join(" ")}
                title={`Page ${page.page ?? index + 1}`}
              >
                <img
                  src={page.url}
                  alt={`Page ${page.page ?? index + 1}`}
                  className="h-28 w-full object-cover object-top"
                />
              </button>
            ))}
          </div>
        </aside>

        <div
          ref={scrollRef}
          className="scrollbar-hide overflow-y-auto px-8 py-10"
        >
          <div className="mx-auto flex w-full max-w-none flex-col items-center gap-10">
            {" "}
            {safePages.map((page, index) => (
              <div
                key={page.url || index}
                ref={(node) => {
                  pageRefs.current[index] = node;
                }}
                data-page-index={index}
                className="w-full"
              >
                <img
                  src={page.url}
                  alt={`Page ${page.page ?? index + 1}`}
                  className="mx-auto w-full rounded-sm bg-white shadow-2xl transition-transform duration-500 hover:scale-[1.005]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export default function ProspectMain({
  content,
  onMeasure,
  hubId,
  shareId,
  hubTitle = "Hub",
  onBack,
  nextItems = [],
  onOpenNext,
  hub,
  styles,
  onContactClick,
}) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (hubId && content?.id) {
      trackContentView({
        hubId,
        shareId: shareId ?? null,
        contentId: content.id,
      });
    }
  }, [hubId, shareId, content?.id]);

  useEffect(() => {
    if (!hubId || !content?.id) return;

    let lastTick = Date.now();

    function flushEngagement({ force = false } = {}) {
      if (!force && document.visibilityState === "hidden") {
        lastTick = Date.now();
        return;
      }

      const now = Date.now();
      const durationSec = Math.round((now - lastTick) / 1000);
      lastTick = now;

      if (durationSec > 0) {
        trackContentEngagement({
          hubId,
          shareId: shareId ?? null,
          contentId: content.id,
          durationSec,
        });
      }
    }

    const intervalId = window.setInterval(flushEngagement, 15000);

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushEngagement({ force: true });
      } else {
        lastTick = Date.now();
      }
    }

    function handlePageHide() {
      flushEngagement({ force: true });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      flushEngagement({ force: true });
    };
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

  function scrollToContent() {
    contentRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const renderEmbed = () => {
    if (!content?.embedUrl) {
      return (
        <div className="rounded-3xl bg-white p-8 text-gray-600">
          No embed URL.
        </div>
      );
    }

    const embed = toEmbed(content.embedUrl, content.name || "Embed");

    if (!embed) {
      return (
        <div className="rounded-3xl bg-white p-8 text-gray-600">
          Invalid or unsupported embed URL.
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
        <div className="relative aspect-video w-full">
          <iframe
            src={embed.src}
            title={embed.title}
            className="absolute inset-0 h-full w-full"
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
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
        <img
          src={fileUrl}
          alt={content?.name || "Image"}
          className="max-h-[760px] w-full object-contain"
        />
      </div>
    ) : (
      <div className="rounded-3xl bg-white p-8 text-gray-600">No file URL.</div>
    );

  const renderPdf = () => {
    if (hasPreviewPages) {
      return (
        <ProspectPdfImageViewer
          pages={previewPages}
          onMeasure={onMeasure}
        />
      );
    }

    if (processingStatus === "pending" || processingStatus === "processing") {
      return (
        <div className="grid min-h-[520px] place-items-center rounded-3xl bg-white p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 h-96 w-80 animate-pulse rounded-md bg-gray-100" />
            <div className="text-sm text-gray-600">
              Preparing document preview…
            </div>

            {fileUrl ? (
              <div className="mt-3">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
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
        <div className="grid min-h-[420px] place-items-center rounded-3xl bg-white p-8">
          <div className="text-center">
            <div className="mb-3 text-sm text-gray-600">
              This document preview is not ready yet.
            </div>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Open original PDF
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-3xl bg-white p-8 text-gray-600">No file URL.</div>
    );
  };

  const contentTypeLabel = getContentTypeLabel(content, fileUrl);

  const viewerContent = (
    <div ref={contentRef}>
      {!content ? (
        <div className="rounded-3xl bg-white p-8 text-gray-600">
          No content selected.
        </div>
      ) : content.kind === "embed" ? (
        renderEmbed()
      ) : isPdf ? (
        renderPdf()
      ) : isImage ? (
        renderImage()
      ) : fileUrl ? (
        <div className="rounded-3xl bg-white p-8">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Open file
          </a>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-8 text-gray-600">
          Nothing to show.
        </div>
      )}

      <NextUpSection items={nextItems} onOpen={onOpenNext} />
    </div>
  );
  const upNext = nextItems?.[0] || null;
  const upNextAsset = upNext?.asset || upNext || null;
  const upNextThumb = upNextAsset ? getThumb(upNextAsset) : null;
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: styles.pageBg,
        backgroundImage: styles.pageGradient,
        color: styles.text,
      }}
    >
      <div
        className="pointer-events-none fixed -right-32 top-24 h-96 w-96 rounded-full blur-3xl"
        style={{ background: `${styles.secondary || styles.brand}33` }}
      />

      <div
        className="pointer-events-none fixed -left-32 bottom-24 h-96 w-96 rounded-full blur-3xl"
        style={{ background: `${styles.brand}22` }}
      />
      <ContentViewerLayout
        header={
          <header
            className="px-6 py-4 md:px-8"
            style={{
              background: "transparent",
            }}
          >
            {" "}
            <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6">
              <div className="flex min-w-0 items-center gap-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="h-9 rounded-full border px-3 text-sm font-medium transition-colors hover:opacity-90"
                  style={{
                    borderColor:
                      styles.viewerBorder || "rgba(255,255,255,0.10)",
                    color: styles.text,
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  ← Back
                </button>

                <div className="hidden h-8 w-px bg-white/10 sm:block" />

                {hub?.logoUrl ? (
                  <img
                    src={hub.logoUrl}
                    alt=""
                    className="max-h-9 max-w-[140px] object-contain"
                  />
                ) : null}

                <div className="hidden h-8 w-px bg-white/10 sm:block" />

                <div className="min-w-0">
                  <div
                    className="truncate text-sm font-semibold"
                    style={{ color: styles.text }}
                  >
                    {" "}
                    {content?.name || "Content"}
                  </div>
                  <div
                    className="truncate text-xs"
                    style={{ color: styles.mutedText }}
                  >
                    {" "}
                    {hubTitle || "Hub"}
                    {content?.description ? ` | ${content.description}` : ""}
                    {contentTypeLabel ? ` | ${contentTypeLabel}` : ""}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {upNext ? (
                  <button
                    type="button"
                    onClick={() => onOpenNext?.(upNext)}
                    className="group relative hidden items-center gap-3 overflow-hidden rounded-2xl border px-3 py-2.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] lg:flex"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))",
                      borderColor:
                        styles.cardGlass?.border || "rgba(255,255,255,0.14)",
                      boxShadow: `${styles.buttonShadow}, 0 0 40px ${styles.secondary || styles.brand}33`,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{
                        background: styles.buttonGradient,
                      }}
                    />

                    <div className="relative z-10 h-11 w-16 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
                      {upNextThumb ? (
                        <img
                          src={upNextThumb}
                          alt=""
                          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : null}
                    </div>

                    <div className="relative z-10 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55 group-hover:text-white/75">
                        <span>Up next</span>
                        <span className="h-1 w-1 rounded-full bg-white/40" />
                        <span>Recommended</span>
                      </div>

                      <div className="mt-1 max-w-[180px] truncate text-sm font-semibold text-white">
                        {upNextAsset?.name || "Next resource"}
                      </div>
                    </div>

                    <div className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/12 text-white transition-transform duration-300 group-hover:translate-x-0.5 group-hover:bg-white/20">
                      →
                    </div>
                  </button>
                ) : null}

                <PremiumButton
                  styles={styles}
                  onClick={onContactClick}
                  icon="sparkle"
                >
                  Contact
                </PremiumButton>
              </div>
            </div>
          </header>
        }
        toolbar={null}
        hero={
          <ContentViewerHero
            asset={content}
            hubTitle={hubTitle}
            contentTypeLabel={contentTypeLabel}
            onStart={scrollToContent}
          />
        }
        content={viewerContent}
        sidebar={null}
      />
    </div>
  );
}
