// AnimatedPdfViewer.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { motion, AnimatePresence } from "framer-motion";

// pdf.js worker (Vite-friendly)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

export default function AnimatedPdfViewer({ url }) {
  const [numPages, setNumPages] = useState(null);
  const [page, setPage] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const wrapRef = useRef(null);

  // Resize observer to make the page fit nicely
  useEffect(() => {
    if (!wrapRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  const onLoad = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setPage(1);
  }, []);

  const prev = () => setPage((p) => Math.max(1, p - 1));
  const next = () =>
    setPage((p) => (numPages ? Math.min(numPages, p + 1) : p + 1));

  // Keyboard nav
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [numPages]);

  return (
    <div className="w-full h-full bg-transparent">
      <div className="h-full w-full grid place-items-center overflow-hidden">
        <div ref={wrapRef} className="w-full max-w-[1100px] px-4">
          <Document
            file={url}
            onLoadSuccess={onLoad}
            loading={null}
            error={null}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
              >
                <Page
                  pageNumber={page}
                  width={Math.max(300, Math.min(1100, containerWidth - 32))}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </motion.div>
            </AnimatePresence>
          </Document>
        </div>
      </div>

      {/* Minimal chrome (optional). Remove if you want literally nothing. */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg px-3 py-1.5 flex items-center gap-3 shadow ring-1 ring-black/5"
        style={{
          backgroundColor: "var(--pv-btn-bg)",
          color: "var(--pv-btn-text)",
        }}
      >
        <button
          onClick={prev}
          className="px-2 py-1 rounded disabled:opacity-50"
          disabled={page <= 1}
        >
          ‹
        </button>
        <span className="text-sm tabular-nums">
          {numPages ? `${page} / ${numPages}` : "— / —"}
        </span>
        <button
          onClick={next}
          className="px-2 py-1 rounded disabled:opacity-50"
          disabled={numPages ? page >= numPages : false}
        >
          ›
        </button>
      </div>
    </div>
  );
}
