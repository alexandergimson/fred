// PdfFlipBook.jsx — stable on resize (no remount/flicker)
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/* small render queue */
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

const BookPage = React.forwardRef(({ children }, ref) => (
  <div ref={ref} className="relative overflow-hidden bg-transparent">
    {children}
  </div>
));

function CanvasPage({ pdf, pageNumber, width, height, queue }) {
  const canvasRef = useRef(null);
  const pageRef = useRef(null);
  const renderTaskRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    if (!pdf || !width || !height || !canvasRef.current) return;

    const renderAt = async (page, scale, dprOverride) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", {
        alpha: false,
        desynchronized: true,
      });
      const vp = page.getViewport({ scale });
      const dpr = dprOverride ?? Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(vp.width * dpr);
      canvas.height = Math.floor(vp.height * dpr);
      canvas.style.width = `${vp.width}px`;
      canvas.style.height = `${vp.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      try {
        renderTaskRef.current?.cancel?.();
      } catch {}
      const task = page.render({ canvasContext: ctx, viewport: vp });
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") throw err;
      } finally {
        if (renderTaskRef.current === task) renderTaskRef.current = null;
      }
    };

    (async () => {
      const page = pageRef.current || (await pdf.getPage(pageNumber));
      if (cancelled) return;
      pageRef.current = page;
      const vp1 = page.getViewport({ scale: 1 });
      const scale = Math.min(width / vp1.width, height / vp1.height);
      try {
        await queue.enqueue(() => renderAt(page, scale, 1));
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") throw err;
        return;
      }
      if (cancelled) return;
      queue.enqueue(() => renderAt(page, scale)).catch(() => {});
    })();

    return () => {
      cancelled = true;
      try {
        renderTaskRef.current?.cancel?.();
      } catch {}
    };
  }, [pdf, pageNumber, width, height, queue]);

  return <canvas ref={canvasRef} style={{ width, height, display: "block" }} />;
}

const PdfFlipBook = forwardRef(function PdfFlipBook(
  {
    url,
    maxConcurrent = 1,
    verticalPad = 32,
    minWidth = 320,
    maxWidth = 1400,
    minHeight = 400,
    maxHeight = 2000,
    gap = 16,
    forceTwoUp = true,
    showCover = false, // default to spread [1|2]
    showInternalArrows = false,
    onFlip,
    onMeasure,
  },
  ref
) {
  const containerRef = useRef(null);
  const flipRef = useRef(null);

  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState(null);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  const [ratio, setRatio] = useState(1.4142);
  const loadedDocRef = useRef(null);

  const queue = useMemo(
    () => createRenderQueue(maxConcurrent),
    [maxConcurrent]
  );

  // one-frame gate to avoid StrictMode training mount paint
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      next: () => flipRef.current?.getPageFlip()?.flipNext(),
      prev: () => flipRef.current?.getPageFlip()?.flipPrev(),
      goto: (p) => {
        const inst = flipRef.current?.getPageFlip?.();
        if (!inst || !Number.isFinite(p)) return;
        inst.flip(p - 1);
      },
      getCurrentPage: () => {
        const idx = flipRef.current?.getPageFlip?.().getCurrentPageIndex?.();
        return typeof idx === "number" ? idx + 1 : null;
      },
    }),
    []
  );

  // destroy flipbook on unmount
  useEffect(
    () => () => {
      try {
        flipRef.current?.getPageFlip?.()?.destroy?.();
      } catch {}
    },
    []
  );

  // external flip callback
  useEffect(() => {
    if (!onFlip) return;
    const inst = flipRef.current?.getPageFlip?.();
    if (!inst) return;
    const handler = (e) => {
      const idx =
        e && e.data && typeof e.data.page === "number"
          ? e.data.page
          : inst.getCurrentPageIndex?.();
      if (typeof idx === "number") onFlip(idx + 1);
    };
    inst.on("flip", handler);
    return () => inst.off("flip", handler);
  }, [onFlip, pdf]);

  // throttle ResizeObserver to rAF (no rapid remounts)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    const updateNow = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const nextW = Math.floor(rect.width);
      const nextH = Math.max(0, Math.floor(rect.height - verticalPad * 2));
      setVw((w) => (w !== nextW ? nextW : w));
      setVh((h) => (h !== nextH ? nextH : h));
    };
    const onResize = () => {
      if (!raf) raf = requestAnimationFrame(updateNow);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    window.addEventListener("resize", onResize);
    onResize(); // initial
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [verticalPad]);

  // load PDF (streaming) + destroy on cleanup
  useEffect(() => {
    let cancelled = false;
    let task = null;
    loadedDocRef.current = null;

    (async () => {
      if (!url) return;
      setError(null);
      setPdf(null);
      setNumPages(0);
      task = pdfjsLib.getDocument({
        url,
        disableStream: false,
        disableAutoFetch: false,
        rangeChunkSize: 64 * 1024,
      });
      try {
        const _pdf = await task.promise;
        if (cancelled) return;
        setPdf(_pdf);
        setNumPages(_pdf.numPages);
        loadedDocRef.current = _pdf;
        try {
          const p1 = await _pdf.getPage(1);
          const vp = p1.getViewport({ scale: 1 });
          const r = vp.height / vp.width;
          if (Number.isFinite(r)) setRatio(r);
        } catch {}
      } catch {
        if (!cancelled) setError("Failed to load PDF.");
      }
    })();

    return () => {
      cancelled = true;
      try {
        task?.destroy?.();
        loadedDocRef.current?.destroy?.();
        loadedDocRef.current = null;
      } catch {}
    };
  }, [url]);

  // compute sizes so two pages fit height and width
  const dims = useMemo(() => {
    if (!vw || !vh) return null;
    let pageH = Math.max(minHeight, Math.min(vh, maxHeight));
    let pageW = Math.max(
      minWidth,
      Math.min(Math.floor(pageH / ratio), maxWidth)
    );
    const combined = pageW * 2 + gap;
    if (combined > vw) {
      const s = vw / combined;
      pageW = Math.floor(pageW * s);
      pageH = Math.floor(pageH * s);
    }
    return {
      pageWidth: pageW,
      pageHeight: pageH,
      bookWidth: Math.min(vw, pageW * 2 + gap),
      bookHeight: pageH,
    };
  }, [vw, vh, ratio, minWidth, maxWidth, minHeight, maxHeight, gap]);

  const totalPages = numPages;

  // Report size to parent (only when we actually have dims & pages)
  React.useEffect(() => {
    if (dims && totalPages) {
      onMeasure?.({
        pageWidth: dims.pageWidth,
        pageHeight: dims.pageHeight,
        bookWidth: dims.bookWidth,
        bookHeight: dims.bookHeight,
      });
    }
  }, [dims, totalPages, onMeasure]);

  // IMPORTANT: key ONLY by file + page count + layout flags (NOT size)
  const flipKey = useMemo(() => {
    if (!url || !totalPages) return "pending";
    return `${url}|${totalPages}|${showCover ? "cover" : "spread"}|${
      forceTwoUp ? "2up" : "auto"
    }`;
  }, [url, totalPages, showCover, forceTwoUp]);

  if (!url) return null;

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      {error ? (
        <div className="p-4 text-sm text-red-600">{error}</div>
      ) : !ready || !pdf || !dims || !totalPages ? (
        <div className="w-full h-full grid place-items-center">
          <div className="w-80 h-96 bg-gray-100 rounded-md animate-pulse" />
        </div>
      ) : (
        <>
          <div
            className="mx-auto"
            style={{
              width: `${dims.bookWidth}px`,
              height: `${dims.bookHeight}px`,
            }}
          >
            <HTMLFlipBook
              key={flipKey} // stable across resizes
              width={dims.pageWidth}
              height={dims.pageHeight}
              size="stretch"
              minWidth={minWidth}
              maxWidth={maxWidth}
              minHeight={minHeight}
              maxHeight={maxHeight}
              showCover={showCover} // default false → first spread [1|2]
              mobileScrollSupport={true}
              usePortrait={!forceTwoUp || showCover} // single cover if cover=true
              startPage={0}
              maxShadowOpacity={0.5}
              className="shadow"
              style={{ margin: "0 auto" }}
              ref={flipRef}
            >
              {Array.from({ length: totalPages }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <BookPage key={pageNumber}>
                    <CanvasPage
                      pdf={pdf}
                      pageNumber={pageNumber}
                      width={dims.pageWidth}
                      height={dims.pageHeight}
                      queue={queue}
                    />
                  </BookPage>
                );
              })}
            </HTMLFlipBook>
          </div>

          {showInternalArrows && (
            <>
              <button
                type="button"
                aria-label="Previous"
                onClick={() => flipRef.current?.getPageFlip()?.flipPrev()}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full shadow p-2 bg-white/90 hover:bg-white"
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
                aria-label="Next"
                onClick={() => flipRef.current?.getPageFlip()?.flipNext()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full shadow p-2 bg-white/90 hover:bg-white"
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
            </>
          )}
        </>
      )}
    </div>
  );
});

export default PdfFlipBook;
