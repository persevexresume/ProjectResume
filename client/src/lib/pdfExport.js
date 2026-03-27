import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const MARGIN_PX = { top: 56, bottom: 56, left: 36, right: 36 }; // ~15mm top/bottom, ~10mm sides
const MARGIN_MM = { top: 15, bottom: 15, left: 10, right: 10 };

const getRelativeTop = (node, rootTop) => {
  const rect = node.getBoundingClientRect();
  if (!rect || !Number.isFinite(rect.top)) return null;
  return Math.max(0, Math.floor(rect.top - rootTop));
};

const collectSortedUnique = (values) => {
  const unique = [...new Set(values.filter((v) => Number.isFinite(v) && v > 0))];
  unique.sort((a, b) => a - b);
  return unique;
};

const pickLastInRange = (sortedValues, minExclusive, maxInclusive) => {
  let picked = null;
  for (const value of sortedValues) {
    if (value <= minExclusive) continue;
    if (value > maxInclusive) break;
    picked = value;
  }
  return picked;
};

const computeFixedOffsets = (totalHeight, contentHeight, maxPages = 15) => {
  const offsets = [0];
  while (offsets.length < maxPages) {
    const next = offsets[offsets.length - 1] + contentHeight;
    if (next >= totalHeight) break;
    offsets.push(next);
  }
  return offsets;
};

const isTwoColumnLayout = (root) => {
  if (!root) return false;

  const candidates = Array.from(root.querySelectorAll('*'));
  for (const node of candidates) {
    if (!(node instanceof HTMLElement)) continue;

    const style = window.getComputedStyle(node);
    const isColumnContainer = style.display === 'flex' || style.display === 'grid';
    if (!isColumnContainer) continue;

    const children = Array.from(node.children).filter((child) => child instanceof HTMLElement);
    if (children.length < 2) continue;

    const parentRect = node.getBoundingClientRect();
    if (!parentRect || parentRect.height < 420 || parentRect.width < 500) continue;

    const childRects = children.map((child) => child.getBoundingClientRect());
    const tallChildren = childRects.filter((rect) => rect.height > 300);
    if (tallChildren.length < 2) continue;

    const first = tallChildren[0];
    const second = tallChildren[1];
    const sideBySide = Math.abs(first.top - second.top) < 40 && Math.abs(first.left - second.left) > 60;
    const widthRatio = Math.min(first.width, second.width) / Math.max(first.width, second.width);

    if (sideBySide && widthRatio > 0.25) {
      return true;
    }
  }

  return false;
};

const computeSmartPageOffsets = (root, totalHeight, contentHeight) => {
  const rect = root.getBoundingClientRect();
  const rootTop = rect.top;
  const maxPages = 15;
  const offsets = [0];

  const sectionStarts = collectSortedUnique(
    Array.from(root.querySelectorAll('.resume-section, section')).map((node) => getRelativeTop(node, rootTop))
  );
  const headingStarts = collectSortedUnique(
    Array.from(root.querySelectorAll('.resume-section-heading, h1, h2, h3, h4')).map((node) => getRelativeTop(node, rootTop))
  );
  const bulletStarts = collectSortedUnique(
    Array.from(root.querySelectorAll('li')).map((node) => getRelativeTop(node, rootTop))
  );
  const blockStarts = collectSortedUnique(
    Array.from(root.querySelectorAll('.resume-entry, p, li, h1, h2, h3, h4, div'))
      .map((node) => getRelativeTop(node, rootTop))
  );

  const minFill = Math.floor(contentHeight * 0.78);
  const headingKeepMin = 72; // Keep heading with at least ~2 lines
  const safetyPad = 18;
  const maxUnusedSpace = 120;

  while (offsets.length < maxPages) {
    const start = offsets[offsets.length - 1];
    const idealEnd = start + contentHeight;

    if (idealEnd >= totalHeight) break;

    const searchMin = start + minFill;
    const searchMax = idealEnd - safetyPad;

    // Prefer starting next page at a section boundary.
    let nextOffset =
      pickLastInRange(sectionStarts, searchMin, searchMax) ??
      pickLastInRange(blockStarts, searchMin, searchMax) ??
      idealEnd;

    // Avoid splitting a bullet point at the bottom edge.
    const bulletNearBottom = pickLastInRange(bulletStarts, start + minFill, nextOffset + 20);
    if (bulletNearBottom && nextOffset - bulletNearBottom < 28) {
      nextOffset = bulletNearBottom;
    }

    // Widow/orphan protection for section headings.
    const headingNearBottom = pickLastInRange(headingStarts, start + minFill, nextOffset);
    if (headingNearBottom && nextOffset - headingNearBottom < headingKeepMin) {
      nextOffset = headingNearBottom;
    }

    // Prevent huge blank gaps at page bottom.
    if (idealEnd - nextOffset > maxUnusedSpace) {
      nextOffset = idealEnd;
    }

    if (nextOffset <= start + 120) {
      nextOffset = idealEnd;
    }

    offsets.push(nextOffset);
  }

  return offsets;
};

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

  const waitForImages = async (root) => {
    const imageNodes = Array.from(root.querySelectorAll('img'));
    if (!imageNodes.length) return;

    await Promise.all(
      imageNodes.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      })
    );
  };

  const getContentBounds = (root) => {
    const baseRect = root.getBoundingClientRect();
    let maxBottom = baseRect.height;

    const nodes = root.querySelectorAll('*');
    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (!rect || !Number.isFinite(rect.bottom)) return;
      const relativeBottom = rect.bottom - baseRect.top;
      if (relativeBottom > maxBottom) maxBottom = relativeBottom;
    });

    return Math.ceil(maxBottom);
  };

  // Clone into an isolated off-screen surface to avoid parent opacity/transform effects.
  const sourceRect = element.getBoundingClientRect();
  const captureWidth = Math.max(
    A4_WIDTH_PX,
    Math.ceil(element.scrollWidth || 0),
    Math.ceil(element.offsetWidth || 0),
    Math.ceil(sourceRect.width || 0)
  );
  const captureHeight = Math.max(A4_HEIGHT_PX, Math.ceil(element.scrollHeight || 0), Math.ceil(element.offsetHeight || 0), Math.ceil(sourceRect.height || 0));

  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-100000px';
  wrapper.style.top = '0';
  wrapper.style.width = `${captureWidth}px`;
  wrapper.style.height = 'auto';
  wrapper.style.background = '#ffffff';
  wrapper.style.opacity = '1';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.overflow = 'hidden';
  wrapper.style.zIndex = '-1';

  const clone = element.cloneNode(true);
  if (clone instanceof HTMLElement) {
    clone.style.width = `${captureWidth}px`;
    clone.style.height = 'auto';
    clone.style.minHeight = `${captureHeight}px`;
    clone.style.background = '#ffffff';
    clone.style.margin = '0';
    clone.style.opacity = '1';
    clone.style.overflow = 'visible';

    // Mark semantic blocks for page-break avoidance.
    clone.querySelectorAll('section').forEach((node) => node.classList.add('resume-section'));
    clone.querySelectorAll('h1, h2, h3').forEach((node) => node.classList.add('resume-section-heading'));
    clone.querySelectorAll('p, li, [data-resume-entry]').forEach((node) => node.classList.add('resume-entry'));
  }

  const pageRuleStyle = document.createElement('style');
  pageRuleStyle.textContent = `
    .resume-section {
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-before: auto;
      break-before: auto;
      orphans: 3;
      widows: 3;
    }
    .resume-section-heading {
      page-break-after: avoid;
      break-after: avoid;
      orphans: 3;
      widows: 3;
    }
    ul, li {
      page-break-inside: avoid;
      break-inside: avoid;
      orphans: 3;
      widows: 3;
    }
  `;

  wrapper.appendChild(pageRuleStyle);
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await waitForImages(clone);

    const computedHeight = Math.max(
      captureHeight,
      Math.ceil(clone.scrollHeight || 0),
      Math.ceil(clone.offsetHeight || 0),
      getContentBounds(clone)
    );

    const contentHeightPx = A4_HEIGHT_PX - MARGIN_PX.top - MARGIN_PX.bottom;
    const forceSynchronizedColumns = isTwoColumnLayout(clone);
    const pageOffsets = forceSynchronizedColumns
      ? computeFixedOffsets(computedHeight, contentHeightPx)
      : computeSmartPageOffsets(clone, computedHeight, contentHeightPx);

    const canvasScale = 2;
    const canvas = await html2canvas(clone, {
      scale: canvasScale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: captureWidth,
      height: computedHeight,
      windowWidth: captureWidth,
      windowHeight: computedHeight,
      scrollX: 0,
      scrollY: 0
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const renderWidthMm = Math.max(1, pageWidth - MARGIN_MM.left - MARGIN_MM.right);
    const renderHeightMm = Math.max(1, pageHeight - MARGIN_MM.top - MARGIN_MM.bottom);

    const imgWidth = canvas.width;
    const contentHeightScaled = Math.max(1, Math.floor((A4_HEIGHT_PX - MARGIN_PX.top - MARGIN_PX.bottom) * canvasScale));
    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d');
    pageCanvas.width = imgWidth;

    pageOffsets.forEach((offset, pageIndex) => {
      const yOffset = Math.max(0, Math.floor(offset * canvasScale));
      const sliceHeight = Math.min(contentHeightScaled, canvas.height - yOffset);
      if (sliceHeight <= 0) return;

      pageCanvas.height = sliceHeight;

      if (pageCtx) {
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(
          canvas,
          0,
          yOffset,
          imgWidth,
          sliceHeight,
          0,
          0,
          imgWidth,
          sliceHeight
        );
      }

      const renderHeight = Math.min(renderHeightMm, (sliceHeight * renderWidthMm) / imgWidth);
      const imgData = pageCanvas.toDataURL('image/png', 1.0);

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(
        imgData,
        'PNG',
        MARGIN_MM.left,
        MARGIN_MM.top,
        renderWidthMm,
        renderHeight,
        undefined,
        'FAST'
      );
    });

    pdf.save(finalName);
    return true;
  } finally {
    wrapper.remove();
  }
};