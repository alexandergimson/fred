// PDFFlipbook.jsx
// Flipbook viewer for double-page PDFs using react-pageflip + pdfjs-dist via react-pdf's pdfjs.
// - Renders each PDF page to an <img> (cached), then uses page-flip animation.
// - Lazy-preloads nearby pages for speed.
// - Exposes prev/next/goTo for your external controls.

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import HTMLFlipBook from "react-pageflip";
import { pdfjs } from "react-pdf";

// ✅ Use the worker from the SAME local pdfjs-dist version as the API (Vite ?worker)
import PdfJsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";
pdfjs.GlobalWorkerOptions.workerPort = new PdfJsWorker();

// -------- Helpers ----------
async function renderPdfPageToDataUrl(pdf, pageNumber, targetHeight = 1400) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const scale = targetHeight / viewport.height;
  const scaledViewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  canvas.width = Math.ceil(scaledViewport.width);
  canvas.height = Math.ceil(scaledViewport.height);

  await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
  const url = canvas.toDataURL("image/jpeg", 0.9);
  page.cleanup?.();
  return {
    url,
    width: canvas.width,
    height: canvas.height,
    aspect: canvas.width / canvas.height,
  };
}

// -------- Component ----------
const PDFFlipbook = forwardRef(function PDFFlipbook(
  { fileUrl, onLoad, onFlip, preloadAhead = 2, maxRenderHeight = 1600 },
  ref
) {
  const frameRef = useRef(null);
  const bookRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [images, setImages] = useState({}); // { [pageNumber]: {url,width,height,aspect} }
  const [pageIndex, setPageIndex] = useState(0); // 0-based current page index
  const [targetHeight, setTargetHeight] = useState(0);

  // 🔒 sticky page + layout signature
  const pageIndexRef = useRef(0);
  const lastLayoutSigRef = useRef({ h: 0, imgs: 0, pages: 0 });

  // Fit to container height
  useEffect(() => {
    if (!frameRef.current || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() =>
      setTargetHeight(frameRef.current.clientHeight)
    );
    ro.observe(frameRef.current);
    return () => ro.disconnect();
  }, []);

  // Reset when file changes
  useEffect(() => {
    pageIndexRef.current = 0;
    lastLayoutSigRef.current = { h: 0, imgs: 0, pages: 0 };
  }, [fileUrl]);

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setPdf(null);
      setNumPages(0);
      setImages({});
      setPageIndex(0);
      if (!fileUrl) return;
      const loadingTask = pdfjs.getDocument({ url: fileUrl });
      const _pdf = await loadingTask.promise;
      if (cancelled) return;
      setPdf(_pdf);
      setNumPages(_pdf.numPages);
      onLoad?.(_pdf.numPages);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fileUrl, onLoad]);

  // Preload current and nearby PAGES
  useEffect(() => {
    if (!pdf || !targetHeight) return;
    const toEnsure = new Set();
    const range = preloadAhead * 2 + 2;
    for (
      let i = Math.max(0, pageIndex - range);
      i <= Math.min(numPages - 1, pageIndex + range);
      i++
    ) {
      toEnsure.add(i + 1);
    }
    (async () => {
      const updates = {};
      for (const n of toEnsure) {
        if (!images[n]) {
          updates[n] = await renderPdfPageToDataUrl(
            pdf,
            n,
            Math.min(maxRenderHeight, targetHeight)
          );
        }
      }
      if (Object.keys(updates).length)
        setImages((prev) => ({ ...prev, ...updates }));
    })();
  }, [
    pdf,
    targetHeight,
    pageIndex,
    numPages,
    images,
    preloadAhead,
    maxRenderHeight,
  ]);

  // Imperative API
  useImperativeHandle(
    ref,
    () => ({
      prev: () => bookRef.current?.pageFlip().flipPrev(),
      next: () => bookRef.current?.pageFlip().flipNext(),
      goTo: (leftPageNumber) => {
        if (!numPages) return;
        const start =
          leftPageNumber % 2 === 1 ? leftPageNumber : leftPageNumber - 1;
        const idx = Math.max(0, Math.min(numPages - 1, start - 1)); // 0-based
        pageIndexRef.current = idx;
        bookRef.current?.pageFlip().flip(idx + 1);
      },
      getCurrentLeftPage: () => {
        const idx =
          bookRef.current?.pageFlip().getCurrentPageIndex?.() ?? pageIndex;
        const n = idx + 1;
        return n % 2 === 1 ? n : n - 1;
      },
    }),
    [numPages, pageIndex]
  );

  // Sync onFlip with parent + sticky ref
  const handleFlip = (e) => {
    const newIdx =
      typeof e?.data === "number"
        ? e.data
        : bookRef.current?.pageFlip().getCurrentPageIndex?.() ?? 0;
    pageIndexRef.current = newIdx;
    setPageIndex(newIdx);
    const n = newIdx + 1;
    const left = n % 2 === 1 ? n : n - 1;
    onFlip?.(left);
  };

  // Page aspect (fallback to A4 portrait)
  const pageAspect = useMemo(() => {
    const sample = images[1] || Object.values(images)[0];
    return sample?.aspect || 210 / 297;
  }, [images]);

  // Recalculate & restore page when layout/assets change (debounced via rAF)
  useEffect(() => {
    const pf = bookRef.current?.pageFlip?.();
    if (!pf) return;

    const h = targetHeight || 0;
    const imgs = Object.keys(images).length;
    const pages = numPages;

    const last = lastLayoutSigRef.current;
    if (last.h === h && last.imgs === imgs && last.pages === pages) return;
    lastLayoutSigRef.current = { h, imgs, pages };

    if (h > 0 && pages > 0 && imgs > 0) {
      try {
        pf.updateFromHtml();
      } catch {}
      const idx = pageIndexRef.current || 0;
      requestAnimationFrame(() => {
        try {
          const current = pf.getCurrentPageIndex?.() ?? 0;
          if (current !== idx) pf.flip(idx + 1);
        } catch {}
      });
    }
  }, [targetHeight, numPages, images]);

  // Render ONE PAGE per child (flipbook pairs them 1–2, 3–4, …)
  return (
    <div ref={frameRef} className="h-full w-full">
      <div className="h-full w-full flex items-center justify-center">
        <HTMLFlipBook
          key={fileUrl} // fresh instance per PDF
          ref={bookRef}
          startPage={pageIndexRef.current + 1} // seed initial page
          width={Math.round((targetHeight || 800) * pageAspect)}
          height={Math.max(200, targetHeight || 800)}
          size="fixed"
          maxShadowOpacity={0.2}
          showCover={false} // 1–2 as first spread
          mobileScrollSupport={true}
          onFlip={handleFlip}
          className="shadow-[0_10px_30px_rgba(0,0,0,0.12)] bg-transparent"
          style={{ userSelect: "none" }}
        >
          {Array.from({ length: numPages }, (_, i) => {
            const n = i + 1;
            const img = images[n]?.url;
            return (
              <div key={`page-${n}`} className="flex h-full w-full bg-white">
                <div className="flex-1 flex items-center justify-center">
                  {img ? (
                    <img
                      src={img}
                      alt={`Page ${n}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-sm text-gray-500">
                      Rendering page {n}…
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </HTMLFlipBook>
      </div>
    </div>
  );
});

export default PDFFlipbook;
