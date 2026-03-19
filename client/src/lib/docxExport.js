import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, convertInchesToTwip } from 'docx';

/**
 * Generate a Word document from resume data
 */
export const generateDocxResume = (resumeData, title = 'Resume') => {
  const { personalInfo, experience, education, skills } = resumeData;

  const sections = [];

  // Header with personal info
  sections.push(
    new Paragraph({
      text: `${personalInfo.firstName} ${personalInfo.lastName}`,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 100 },
    })
  );

  // Contact info
  if (personalInfo.email || personalInfo.phone || personalInfo.location) {
    const contactInfo = [
      personalInfo.email,
      personalInfo.phone,
      personalInfo.location
    ].filter(Boolean).join(' • ');

    sections.push(
      new Paragraph({
        text: contactInfo,
        spacing: { after: 200 },
      })
    );
  }

  // Title
  if (personalInfo.title) {
    sections.push(
      new Paragraph({
        text: personalInfo.title,
        bold: true,
        spacing: { after: 200 },
      })
    );
  }

  // Summary
  if (personalInfo.summary) {
    sections.push(
      new Paragraph({
        text: 'PROFESSIONAL SUMMARY',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    sections.push(
      new Paragraph({
        text: personalInfo.summary,
        spacing: { after: 200 },
      })
    );
  }

  // Experience
  if (experience && experience.length > 0) {
    sections.push(
      new Paragraph({
        text: 'WORK EXPERIENCE',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    experience.forEach((exp) => {
      sections.push(
        new Paragraph({
          text: exp.role,
          bold: true,
          spacing: { after: 50 },
        })
      );

      const expHeader = [
        exp.company,
        exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : ''
      ].filter(Boolean).join(' | ');

      sections.push(
        new Paragraph({
          text: expHeader,
          italics: true,
          spacing: { after: 100 },
        })
      );

      if (exp.description) {
        sections.push(
          new Paragraph({
            text: exp.description,
            spacing: { after: 150 },
          })
        );
      }
    });
  }

  // Education
  if (education && education.length > 0) {
    sections.push(
      new Paragraph({
        text: 'EDUCATION',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    education.forEach((edu) => {
      sections.push(
        new Paragraph({
          text: edu.degree,
          bold: true,
          spacing: { after: 50 },
        })
      );

      const eduHeader = [
        edu.school,
        edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : ''
      ].filter(Boolean).join(' | ');

      sections.push(
        new Paragraph({
          text: eduHeader,
          italics: true,
          spacing: { after: 150 },
        })
      );
    });
  }

  // Skills
  if (skills && skills.length > 0) {
    sections.push(
      new Paragraph({
        text: 'SKILLS',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    sections.push(
      new Paragraph({
        text: skills.join(' • '),
        spacing: { after: 200 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      }
    ],
  });

  return doc;
};

/**
 * Download resume as Word document
 */
export const downloadDocxResume = async (resumeData, title = 'Resume') => {
  try {
    const doc = generateDocxResume(resumeData, title);
    const blob = await Packer.toBlob(doc);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'resume'}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error generating DOCX:', error);
    throw error;
  }
};
