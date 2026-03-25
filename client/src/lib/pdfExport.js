import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportElementToPaginatedPdf = async (element, fileName = 'resume.pdf') => {
  if (!element) {
    throw new Error('Export element not found');
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const safeName = String(fileName || 'resume.pdf')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const finalName = safeName.toLowerCase().endsWith('.pdf') ? safeName : `${safeName}.pdf`;

  // Get the actual dimensions from the element
  const sourceRect = element.getBoundingClientRect();
  const captureWidth = Math.max(794, Math.ceil(element.scrollWidth || sourceRect.width));
  const captureHeight = Math.max(1123, Math.ceil(element.scrollHeight || sourceRect.height));

  // Create a temporary visible wrapper for proper rendering
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '0';
  wrapper.style.top = '0';
  wrapper.style.width = `${captureWidth}px`;
  wrapper.style.height = `${captureHeight}px`;
  wrapper.style.background = '#ffffff';
  wrapper.style.opacity = '0';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.overflow = 'hidden';
  wrapper.style.zIndex = '9999';
  wrapper.style.visibility = 'visible';

  const clone = element.cloneNode(true);
  if (clone instanceof HTMLElement) {
    clone.style.width = `${captureWidth}px`;
    clone.style.height = 'auto';
    clone.style.minHeight = `${captureHeight}px`;
    clone.style.background = '#ffffff';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.opacity = '1';
    clone.style.position = 'relative';
    clone.style.top = '0';
    clone.style.left = '0';
  }

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    // Wait for fonts and rendering
    await new Promise((resolve) => {
      setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(resolve)), 100);
    });

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: captureWidth,
      height: captureHeight,
      windowWidth: captureWidth,
      windowHeight: captureHeight,
      scrollX: 0,
      scrollY: 0,
      allowTaint: true,
      foreignObjectRendering: true
    });

    const pdf = new jsPDF({ 
      orientation: 'portrait', 
      unit: 'mm', 
      format: 'a4', 
      compress: true,
      precision: 16
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Calculate scaling to fit within A4 page
    const scale = Math.min(pageWidth / (imgWidth / 96 * 25.4), pageHeight / (imgHeight / 96 * 25.4));
    const pdfWidth = (imgWidth / 96 * 25.4) * scale;
    const pdfHeight = (imgHeight / 96 * 25.4) * scale;
    
    const offsetX = (pageWidth - pdfWidth) / 2;
    const offsetY = (pageHeight - pdfHeight) / 2;

    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', offsetX, offsetY, pdfWidth, pdfHeight, undefined, 'FAST');
    
    // Add additional pages if content exceeds one page
    let heightUsed = pdfHeight;
    while (heightUsed < pdfHeight && heightUsed < pageHeight * 2) {
      const additionalImgData = canvas.toDataURL('image/png', 1.0);
      pdf.addPage();
      pdf.addImage(additionalImgData, 'PNG', offsetX, offsetY, pdfWidth, pdfHeight, undefined, 'FAST');
      heightUsed += pageHeight;
    }
    
    pdf.save(finalName);
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  } finally {
    wrapper.remove();
  }
};