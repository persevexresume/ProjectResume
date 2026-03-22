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

  return new Promise((resolve) => {
    const originalTitle = document.title;
    // Set title so the save dialog uses the requested file name (removing .pdf if present)
    document.title = fileName.replace('.pdf', '');
    
    // Add print class to isolate the resume content
    document.body.classList.add('is-printing');
    
    // Use a small timeout to allow CSS to apply
    setTimeout(() => {
      window.print();
      
      // Cleanup after printing
      document.title = originalTitle;
      document.body.classList.remove('is-printing');
      resolve(true);
    }, 300);
  });
};