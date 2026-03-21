import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportElementToPaginatedPdf = async (element, fileName = 'resume.pdf') => {
  if (!element) {
    throw new Error('Export element not found');
  }

  // Ensure all fonts and images are fully loaded before rendering
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  // Use a scaling factor for high resolution
  const scale = 2;
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.getElementById(element.id);
      if (clonedElement) {
        clonedElement.style.overflow = 'visible';
        clonedElement.style.height = 'auto';
        clonedElement.style.minHeight = '0';
        clonedElement.style.aspectRatio = 'auto';
      }
    },
  });

  // Standard A4 width in pt
  const pdfWidth = 595.28; 
  // Calculate the proportional height for the PDF based on the entire canvas
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  // Create a single continuous PDF page that dynamically fits ALL content perfectly
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [pdfWidth, pdfHeight],
  });

  const pageData = canvas.toDataURL('image/png');

  // Add the single image covering the exact size of the dynamic page
  pdf.addImage(pageData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  // Save the PDF
  pdf.save(fileName);
};