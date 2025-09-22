// PdfViewer.jsx — Two-up, no scrolling, arrow navigation
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/** Limit concurrent renders (keeps main thread smooth) */
function createRenderQueue(maxConcurrent = 1) {
  let active = 0;
  const q = [];
  const run = () => {
    if (active >= maxConcurrent) return;
    const next = q.shift();
    if (!next) return;
    active++;
    next()
      .catch(() => {})
      .finally(() => {
        active--;
        run();
      });
  };
  const enqueue = (fn) =>
    new Promise((res, rej) => {
      q.push(() => fn().then(res, rej));
      run();
    });
  return { enqueue };
}

/** A single page canvas: renders with a fast pass then upgrades to crisp */
function PageCanvas({ page, scale, width, height, queue }) {
  const canvasRef = useRef(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (!page || !scale || !canvasRef.current || width <= 0 || height <= 0)
      return;
    let cancelled = false;

    const renderAt = async (s, dprOverride) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", {
        alpha: false,
        desynchronized: true,
      });

      const vp = page.getViewport({ scale: s });
      const dpr = dprOverride ?? Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.floor(vp.width * dpr);
      const H = Math.floor(vp.height * dpr);

      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${vp.width}px`;
      canvas.style.height = `${vp.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      await page.render({ canvasContext: ctx, viewport: vp }).promise;
    };

    const run = async () => {
      // fast pass at DPR=1 for instant paint
      await queue.enqueue(() => renderAt(scale, 1));
      if (cancelled) return;
      // crisp upgrade at device DPR
      queueMicrotask(() => {
        queue.enqueue(() => renderAt(scale)).catch(() => {});
      });
      renderedRef.current = true;
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [page, scale, width, height, queue]);

  return (
    <div
      className="relative bg-gray-100 rounded-md overflow-hidden"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, display: "block" }}
      />
    </div>
  );
}

/** Main two-up viewer */
export default function PdfViewer({
  url,
  rangeChunkSize = 64 * 1024,
  gap = 16, // px between pages
  maxWidth = 1400, // cap outer width; increase if you want wider pages
  maxConcurrent = 1, // keep 1 to avoid jank
}) {
  const outerRef = useRef(null); // full-height scroll-less container
  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState(null);

  // measurement
  const [vw, setVw] = useState(0); // inner content width cap
  const [vh, setVh] = useState(0); // available height for pages

  // current spread (1-based start of pair: 1,3,5,...)
  const [startPage, setStartPage] = useState(1);

  // simple cache for pages
  const pageCache = useRef(new Map()); // number => PDFPageProxy
  const queue = useMemo(
    () => createRenderQueue(maxConcurrent),
    [maxConcurrent]
  );

  // Measure viewport (width & height) and keep in sync
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      // leave some padding for aesthetics (matches p-4 on container)
      const pad = 32;
      const height = Math.max(0, Math.floor(rect.height - pad * 2));
      const widthCap = Math.min(Math.floor(rect.width - pad * 2), maxWidth);
      setVh(height);
      setVw(widthCap);
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [maxWidth]);

  // Load PDF (streaming)
  useEffect(() => {
    let cancelled = false;
    let task = null;
    async function load() {
      if (!url) return;
      setError(null);
      setPdf(null);
      setNumPages(0);
      pageCache.current.clear();

      task = pdfjsLib.getDocument({
        url,
        disableStream: false,
        disableAutoFetch: false,
        rangeChunkSize,
      });

      try {
        const _pdf = await task.promise;
        if (cancelled) return;
        setPdf(_pdf);
        setNumPages(_pdf.numPages);
      } catch (e) {
        if (!cancelled) setError("Failed to load PDF.");
      }
    }
    load();
    return () => {
      cancelled = true;
      try {
        task?.destroy?.();
      } catch {}
    };
  }, [url, rangeChunkSize]);

  // Ensure startPage is valid when numPages changes
  useEffect(() => {
    if (!numPages) return;
    setStartPage((s) =>
      s > numPages ? (numPages % 2 === 0 ? numPages - 1 : numPages) : s
    );
  }, [numPages]);

  // Fetch a page (with cache)
  const getPage = useCallback(
    async (n) => {
      if (!pdf || n < 1 || n > numPages) return null;
      if (pageCache.current.has(n)) return pageCache.current.get(n);
      const p = await pdf.getPage(n);
      pageCache.current.set(n, p);
      return p;
    },
    [pdf, numPages]
  );

  // Prefetch neighbor spread
  useEffect(() => {
    if (!pdf) return;
    const nextA = startPage + 2;
    const nextB = startPage + 3;
    getPage(nextA);
    getPage(nextB);
  }, [pdf, startPage, getPage]);

  // Compute scales & pixel sizes so both pages fit height AND width
  const [pageA, pageB, dims] = useTwoUpLayout({
    pdf,
    getPage,
    startPage,
    vh,
    vw,
    gap,
  });

  const canPrev = startPage > 1;
  const canNext = startPage + 1 < numPages;

  const gotoPrev = () => setStartPage((s) => Math.max(1, s - 2));
  const gotoNext = () => setStartPage((s) => (s + 1 < numPages ? s + 2 : s));

  // keyboard arrows
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") gotoNext();
      else if (e.key === "ArrowLeft") gotoPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [numPages, startPage]);

  if (!url) return null;

  return (
    <div
      ref={outerRef}
      className="w-full h-full bg-white relative overflow-hidden p-4"
    >
      {error ? (
        <div className="p-4 text-sm text-red-600">{error}</div>
      ) : !pdf || !dims ? (
        <div className="w-full h-full grid place-items-center">
          <div className="w-80 h-96 bg-gray-100 rounded-md animate-pulse" />
        </div>
      ) : (
        <>
          {/* center the spread */}
          <div
            className="mx-auto flex items-center justify-center"
            style={{
              width: `${dims.totalWidth}px`,
              height: `${dims.targetHeight}px`,
              gap: `${gap}px`,
            }}
          >
            {/* Left page */}
            {pageA ? (
              <PageCanvas
                page={pageA}
                scale={dims.scaleA}
                width={dims.widthA}
                height={dims.heightA}
                queue={queue}
              />
            ) : (
              <div
                style={{ width: dims.widthA, height: dims.heightA }}
                className="bg-gray-100 rounded-md"
              />
            )}
            {/* Right page (optional if exists) */}
            {pageB ? (
              <PageCanvas
                page={pageB}
                scale={dims.scaleB}
                width={dims.widthB}
                height={dims.heightB}
                queue={queue}
              />
            ) : (
              <div
                style={{ width: dims.widthB, height: dims.heightB }}
                className="bg-gray-50 rounded-md"
              />
            )}
          </div>

          {/* Navigation arrows */}
          <button
            type="button"
            aria-label="Previous pages"
            disabled={!canPrev}
            onClick={gotoPrev}
            className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-full shadow p-2 ${
              canPrev
                ? "bg-white hover:bg-gray-50"
                : "bg-gray-200 cursor-not-allowed"
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next pages"
            disabled={!canNext}
            onClick={gotoNext}
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full shadow p-2 ${
              canNext
                ? "bg-white hover:bg-gray-50"
                : "bg-gray-200 cursor-not-allowed"
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Page indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-gray-600 bg-white/80 rounded px-2 py-1 shadow">
            {startPage}
            {pageB ? `–${startPage + 1}` : ""} / {numPages}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Compute the two-up layout:
 *  - load the two pages for the current spread
 *  - scale each to fit the target height (viewport height minus padding)
 *  - if combined width exceeds the content width cap, shrink both uniformly
 */
function useTwoUpLayout({ pdf, getPage, startPage, vh, vw, gap }) {
  const [pageA, setPageA] = useState(null);
  const [pageB, setPageB] = useState(null);
  const [dims, setDims] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!pdf || vh <= 0 || vw <= 0 || !startPage) {
        setDims(null);
        return;
      }

      // Load both pages (cache-aware)
      const A = await getPage(startPage);
      const B = await getPage(startPage + 1);

      if (cancelled) return;
      setPageA(A);
      setPageB(B);

      // If we don't have at least one page, bail
      if (!A && !B) {
        setDims(null);
        return;
      }

      // Work out intrinsic sizes at scale=1
      const vpA = A ? A.getViewport({ scale: 1 }) : null;
      const vpB = B ? B.getViewport({ scale: 1 }) : null;

      // Target height is viewport height (vh)
      const targetHeight = vh;

      // Scales to fit height
      const sA0 = A ? targetHeight / vpA.height : 1;
      const sB0 = B ? targetHeight / vpB.height : 1;

      // Preliminary widths
      const wA0 = A ? vpA.width * sA0 : 0;
      const wB0 = B ? vpB.width * sB0 : 0;

      // Total width including gap
      const combined0 = wA0 + (B ? gap : 0) + wB0;

      // If too wide, shrink both uniformly
      const shrink = combined0 > vw ? vw / combined0 : 1;

      const scaleA = A ? sA0 * shrink : 0;
      const scaleB = B ? sB0 * shrink : 0;

      const widthA = A ? Math.floor(vpA.width * scaleA) : 0;
      const heightA = A ? Math.floor(vpA.height * scaleA) : 0;
      const widthB = B ? Math.floor(vpB.width * scaleB) : 0;
      const heightB = B ? Math.floor(vpB.height * scaleB) : 0;

      const totalWidth = Math.floor(widthA + (B ? gap : 0) + widthB);

      if (!cancelled) {
        setDims({
          targetHeight,
          totalWidth,
          scaleA,
          scaleB,
          widthA,
          heightA,
          widthB,
          heightB,
        });
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [pdf, getPage, startPage, vh, vw, gap]);

  return [pageA, pageB, dims];
}
