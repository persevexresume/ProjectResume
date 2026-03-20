import React, { useRef, useEffect, useState } from 'react';

/**
 * Multi-Page Resume Wrapper
 * Automatically handles content that spans multiple pages
 */
export default function MultiPageResumeWrapper({ children }) {
  const containerRef = useRef(null);
  const [pages, setPages] = useState([children]);

  useEffect(() => {
    // Enable print-friendly page breaks
    const handlePrint = () => {
      window.print();
    };

    window.addEventListener('beforeprint', handlePrint);
    return () => window.removeEventListener('beforeprint', handlePrint);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px',
        background: '#f5f5f5'
      }}
    >
      {/* Main page with all content - let it flow naturally */}
      <div
        style={{
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          overflow: 'hidden',
          pageBreakAfter: 'always'
        }}
      >
        {children}
      </div>

      {/* Print styles for multi-page support */}
      <style>{`
        @media print {
          body, html {
            margin: 0;
            padding: 0;
            background: #fff;
          }

          /* Force page breaks after each A4 page */
          [data-page] {
            page-break-after: always;
            page-break-inside: avoid;
          }

          /* Prevent breaking inside sections */
          section {
            page-break-inside: avoid;
          }

          /* Allow breaking between entries */
          .resume-entry {
            page-break-inside: avoid;
          }

          /* Proper margins for printed pages */
          @page {
            size: A4;
            margin: 0;
          }
        }

        /* Screen view: show page borders */
        @media screen {
          [style*="width: 816px"] {
            max-height: 1056px;
            margin-bottom: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        }
      `}</style>
    </div>
  );
}
