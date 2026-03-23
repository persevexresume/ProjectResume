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

  // Clone into an isolated off-screen surface to avoid parent opacity/transform effects.
  const sourceRect = element.getBoundingClientRect();
  const captureWidth = Math.max(794, Math.ceil(element.scrollWidth || sourceRect.width));
  const captureHeight = Math.max(1123, Math.ceil(element.scrollHeight || sourceRect.height));

  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-100000px';
  wrapper.style.top = '0';
  wrapper.style.width = `${captureWidth}px`;
  wrapper.style.height = `${captureHeight}px`;
  wrapper.style.background = '#ffffff';
  wrapper.style.opacity = '1';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.overflow = 'hidden';
  wrapper.style.zIndex = '-1';

  const clone = element.cloneNode(true);
  if (clone instanceof HTMLElement) {
    clone.style.width = `${captureWidth}px`;
    clone.style.minHeight = `${captureHeight}px`;
    clone.style.background = '#ffffff';
    clone.style.margin = '0';
    clone.style.opacity = '1';
  }

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

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
      scrollY: 0
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const fitScale = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
    const renderWidth = imgWidth * fitScale;
    const renderHeight = imgHeight * fitScale;
    const offsetX = (pageWidth - renderWidth) / 2;
    const offsetY = (pageHeight - renderHeight) / 2;

    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST');
    pdf.save(finalName);
    return true;
  } finally {
    wrapper.remove();
  }
};