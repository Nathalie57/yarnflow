/**
 * @file PDFViewer.jsx
 * @brief Visualiseur PDF avec zoom interne (compatible PWA)
 * @author Nathalie + AI Assistants
 * @created 2025-11-30
 * @modified 2025-12-10 by [AI:Claude] - Zoom interne pour PWA
 */

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// Configuration du worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const PDFViewer = ({ url, fileName = 'patron.pdf' }) => {
  const [numPages, setNumPages] = useState(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [scale, setScale] = useState(1)
  const containerRef = useRef(null)
  const scrollContainerRef = useRef(null)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleResetZoom = () => {
    setScale(1)
  }

  return (
    <div ref={containerRef} className="w-full">
      {/* Contrôles de zoom */}
      <div className="flex justify-center gap-2 mb-3 py-2 border-b bg-gray-50">
        <button
          onClick={handleZoomOut}
          className="px-3 py-1 bg-white hover:bg-gray-100 rounded text-sm font-medium border"
          disabled={scale <= 0.5}
        >
          −
        </button>
        <button
          onClick={handleResetZoom}
          className="px-3 py-1 bg-white hover:bg-gray-100 rounded text-sm font-medium min-w-[60px] border"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          className="px-3 py-1 bg-white hover:bg-gray-100 rounded text-sm font-medium border"
          disabled={scale >= 3}
        >
          +
        </button>
      </div>

      {/* Conteneur scrollable pour le PDF */}
      <div
        ref={scrollContainerRef}
        className="overflow-auto"
        style={{ maxHeight: '600px' }}
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-500">Chargement du PDF...</div>
            </div>
          }
          error={
            <div className="flex items-center justify-center py-20">
              <div className="text-red-500">Erreur lors du chargement du PDF</div>
            </div>
          }
        >
          {numPages && Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={containerWidth > 0 ? containerWidth * scale : undefined}
              className="mb-4 shadow-sm"
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          ))}
        </Document>
      </div>
    </div>
  )
}

export default PDFViewer
