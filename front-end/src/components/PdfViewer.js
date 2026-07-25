import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path from public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const PdfViewer = ({ blobUrl }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pages, setPages] = useState([]);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!blobUrl) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPages([]);

    const loadPdf = async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ url: blobUrl }).promise;
        if (cancelled) return;

        setTotalPages(pdf.numPages);
        const pageCanvases = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.2 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto 8px auto';

          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;

          pageCanvases.push(canvas);
        }

        if (!cancelled) {
          setPages(pageCanvases);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load PDF: ' + err.message);
          setLoading(false);
        }
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [blobUrl]);

  useEffect(() => {
    if (pages.length > 0 && containerRef.current) {
      containerRef.current.innerHTML = '';
      pages.forEach(canvas => containerRef.current.appendChild(canvas));
    }
  }, [pages]);

  if (error) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#d32f2f' }}>{error}</div>;
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading PDF...</div>;
  }

  return (
    <div ref={containerRef} style={{ width: '100%', maxHeight: '70vh', overflow: 'auto', backgroundColor: '#525659', padding: 8 }} />
  );
};

export default PdfViewer;
