import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

function PdfCanvas({
  pdf,
  pageNumber,
  width,
  height,
  priority = "normal",
  onRendered,
}) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    if (!pdf || !pageNumber || !canvasRef.current || !width || !height) return;

    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;

      const vp1 = page.getViewport({ scale: 1 });
      const scale = Math.min(width / vp1.width, height / vp1.height);
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", {
        alpha: false,
        desynchronized: true,
      });

      const dpr =
        priority === "high" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      try {
        renderTaskRef.current?.cancel?.();
      } catch {}

      const task = page.render({
        canvasContext: ctx,
        viewport,
      });

      renderTaskRef.current = task;

      try {
        await task.promise;
        if (!cancelled) onRendered?.(pageNumber);
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") throw err;
      }
    })();

    return () => {
      cancelled = true;
      try {
        renderTaskRef.current?.cancel?.();
      } catch {}
    };
  }, [pdf, pageNumber, width, height, priority, onRendered]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        display: "block",
        background: "#fff",
      }}
    />
  );
}

export default function ProspectPdfViewer({ url, onMeasure }) {
  const containerRef = useRef(null);

  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [ratio, setRatio] = useState(1.4142);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  const [displaySpread, setDisplaySpread] = useState(1);
  const [pendingSpread, setPendingSpread] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const renderedRef = useRef(new Set());

  // Load PDF
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!url) return;

      setPdf(null);
      setDisplaySpread(1);
      setPendingSpread(null);
      setIsTransitioning(false);
      renderedRef.current.clear();

      const task = pdfjsLib.getDocument({ url });

      try {
        const doc = await task.promise;
        if (cancelled) return;

        setPdf(doc);
        setNumPages(doc.numPages);

        const p1 = await doc.getPage(1);
        const vp = p1.getViewport({ scale: 1 });
        setRatio(vp.height / vp.width);
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setVw(rect.width);
      setVh(rect.height);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dims = useMemo(() => {
    if (!vw || !vh) return null;

    let h = Math.min(vh, 1400);
    let w = Math.floor(h / ratio);

    if (w * 2 > vw) {
      const s = vw / (w * 2);
      w *= s;
      h *= s;
    }

    return { pageWidth: w, pageHeight: h, bookWidth: w * 2 };
  }, [vw, vh, ratio]);

  const goToSpread = (next) => {
    if (next === displaySpread || next < 1) return;

    renderedRef.current.clear();
    setPendingSpread(next);
    setIsTransitioning(true);
  };

  const handleRendered = useCallback(
    (page) => {
      if (!pendingSpread) return;

      renderedRef.current.add(page);

      const left = pendingSpread;
      const right = pendingSpread + 1;

      const readyLeft = renderedRef.current.has(left);
      const readyRight = right > numPages || renderedRef.current.has(right);

      if (readyLeft && readyRight) {
        setDisplaySpread(pendingSpread);
        setPendingSpread(null);
        setIsTransitioning(false);
      }
    },
    [pendingSpread, numPages],
  );

  const isReady = pdf && dims;
  const left = displaySpread;
  const right = displaySpread + 1 <= numPages ? displaySpread + 1 : null;

  const pendingLeft = pendingSpread;
  const pendingRight =
    pendingSpread && pendingSpread + 1 <= numPages ? pendingSpread + 1 : null;

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {!isReady ? (
        <div className="w-full h-full grid place-items-center">
          <div className="w-80 h-96 bg-gray-100 rounded-md animate-pulse" />
        </div>
      ) : (
        <>
          <button onClick={() => goToSpread(left - 2)}>Prev</button>

          <div
            style={{
              width: dims.bookWidth,
              margin: "0 auto",
              position: "relative",
            }}
          >
            {/* visible */}
            <div
              style={{ display: "flex", opacity: isTransitioning ? 0.9 : 1 }}
            >
              <PdfCanvas
                pdf={pdf}
                pageNumber={left}
                width={dims.pageWidth}
                height={dims.pageHeight}
                priority="high"
              />
              {right && (
                <PdfCanvas
                  pdf={pdf}
                  pageNumber={right}
                  width={dims.pageWidth}
                  height={dims.pageHeight}
                  priority="high"
                />
              )}
            </div>

            {/* hidden preload */}
            {pendingSpread && (
              <div style={{ position: "absolute", inset: 0, opacity: 0 }}>
                <PdfCanvas
                  pdf={pdf}
                  pageNumber={pendingLeft}
                  width={dims.pageWidth}
                  height={dims.pageHeight}
                  priority="high"
                  onRendered={handleRendered}
                />
                {pendingRight && (
                  <PdfCanvas
                    pdf={pdf}
                    pageNumber={pendingRight}
                    width={dims.pageWidth}
                    height={dims.pageHeight}
                    priority="high"
                    onRendered={handleRendered}
                  />
                )}
              </div>
            )}
          </div>

          <button onClick={() => goToSpread(left + 2)}>Next</button>
        </>
      )}
    </div>
  );
}
