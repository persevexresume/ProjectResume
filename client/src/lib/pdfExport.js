import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Exports an element to a professional A4 PDF.
 * Implements specific A4 dimensions, margins, and overflow handling.
 * 
 * @param {HTMLElement} element - The element to export
 * @param {string} fileName - The name of the resulting PDF file
 */
export const exportElementToPaginatedPdf = async (element, fileName = 'resume.pdf') => {
  if (!element) {
    throw new Error('Export element not found');
  }

  // Ensure fonts are loaded
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const safeName = String(fileName || 'resume.pdf')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const finalName = safeName.toLowerCase().endsWith('.pdf') ? safeName : `${safeName}.pdf`;

  // 1. Temporarily set resume container styles
  const originalStyles = {
    width: element.style.width,
    height: element.style.height,
    padding: element.style.padding,
    boxSizing: element.style.boxSizing,
    overflow: element.style.overflow,
    margin: element.style.margin,
    background: element.style.background,
    transform: element.style.transform,
    transformOrigin: element.style.transformOrigin,
    position: element.style.position,
    zIndex: element.style.zIndex,
    top: element.style.top,
    left: element.style.left,
    opacity: element.style.opacity,
    pointerEvents: element.style.pointerEvents
  };

  const originalScrollbar = document.body.style.overflow;

  // Capture full content height as one continuous page.
  element.style.width = '794px';
  element.style.height = 'auto';
  element.style.minHeight = '0';
  element.style.padding = '20px 18px'; // 15mm top/bottom, 12mm sides (approx)
  element.style.boxSizing = 'border-box';
  element.style.overflow = 'visible';
  element.style.margin = '0';
  element.style.background = 'white';
  element.style.transform = 'none';
  
  // Ensure it's visible for capture if it was hidden
  element.style.position = 'fixed';
  element.style.top = '0';
  element.style.left = '0';
  element.style.opacity = '1';
  element.style.zIndex = '9999';
  element.style.pointerEvents = 'none';

  // Inject temporary CSS for columns if needed
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    #resume-preview-download .left-col, .resume-container .left-col {
      width: 38% !important;
      min-height: 1083px !important;
    }
    #resume-preview-download .right-col, .resume-container .right-col {
      width: 62% !important;
      min-height: 1083px !important;
    }
  `;
  document.head.appendChild(styleTag);

  // Hide scrollbars
  document.body.style.overflow = 'hidden';

  try {
    // Wait for a frame to ensure styles are applied
    await new Promise(resolve => requestAnimationFrame(resolve));

    const captureWidth = 794;
    const captureHeight = Math.max(
      element.scrollHeight || 0,
      element.offsetHeight || 0,
      1123
    );

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      scrollY: -window.scrollY,
      windowWidth: captureWidth,
      windowHeight: captureHeight,
      width: captureWidth,
      height: captureHeight,
      backgroundColor: '#ffffff',
      logging: false
    });

    const pageWidthMm = 210;
    const pageHeightMm = Math.max(297, (canvas.height * pageWidthMm) / canvas.width);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidthMm, pageHeightMm]
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    // Render as one long page with no splitting.
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm);
    pdf.save(finalName);
    
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  } finally {
    // 3. Restore original styles
    Object.assign(element.style, originalStyles);
    document.body.style.overflow = originalScrollbar;
    document.head.removeChild(styleTag);
  }
};

