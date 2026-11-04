const PDFDocument = require('pdfkit');

const M = { top: 44, bottom: 44, left: 50, right: 50 };
const INK = '#1F2937';
const MUTED = '#4B5563';

const contentWidth = (doc) => doc.page.width - M.left - M.right;

// Runs `draw` against a new document and resolves with the finished file as a Buffer
const render = (info, draw) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: M, info });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      draw(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });

const sectionHeading = (doc, text) => {
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#111827')
    .text(text.toUpperCase(), M.left, doc.y, { width: contentWidth(doc) });
  const y = doc.y + 1;
  doc.moveTo(M.left, y).lineTo(M.left + contentWidth(doc), y).lineWidth(0.7).strokeColor('#9CA3AF').stroke();
  doc.x = M.left;
  doc.y = y + 5;
};

// "Role, Company ........................ Jan 2024 - Present"
const entryHeader = (doc, title, dates) => {
  const w = contentWidth(doc);
  const y = doc.y;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827')
    .text(title, M.left, y, { width: w - (dates ? 128 : 0) });
  const afterTitle = doc.y;
  if (dates) {
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(dates, M.left, y, { width: w, align: 'right' });
  }
  doc.x = M.left;
  doc.y = Math.max(afterTitle, doc.y);
};

// Bullet character is real text, so ATS parsers can read it
const bulletList = (doc, items) => {
  for (const item of items) {
    if (doc.y + 26 > doc.page.height - M.bottom) doc.addPage();
    const y = doc.y;
    doc.font('Helvetica').fontSize(9.8).fillColor(INK).text('\u2022', M.left + 3, y, { lineBreak: false });
    doc.text(item, M.left + 14, y, { width: contentWidth(doc) - 14, lineGap: 1.5 });
  }
  doc.x = M.left;
  doc.moveDown(0.3);
};

const paragraph = (doc, text) => {
  doc.font('Helvetica').fontSize(9.8).fillColor(INK).text(text, M.left, doc.y, { width: contentWidth(doc), lineGap: 1.5 });
  doc.x = M.left;
};

const nameBlock = (doc, data) => {
  doc.font('Helvetica-Bold').fontSize(20).fillColor('#111827')
    .text(data.name, M.left, M.top, { width: contentWidth(doc), align: 'center' });
  if (data.contact.length) {
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED)
      .text(data.contact.join('   |   '), M.left, doc.y + 2, { width: contentWidth(doc), align: 'center' });
  }
};

const resumePdf = (data) =>
  render({ Title: `${data.name} - Resume`, Author: data.name }, (doc) => {
    nameBlock(doc, data);

    if (data.summary) {
      sectionHeading(doc, 'Summary');
      paragraph(doc, data.summary);
    }
    if (data.skills.length) {
      sectionHeading(doc, 'Skills');
      paragraph(doc, data.skills.join(', '));
    }
    if (data.experience.length) {
      sectionHeading(doc, 'Experience');
      data.experience.forEach((e) => {
        entryHeader(doc, e.title, e.dates);
        bulletList(doc, e.bullets);
      });
    }
    if (data.projects.length) {
      sectionHeading(doc, 'Projects');
      data.projects.forEach((p) => {
        entryHeader(doc, p.title, '');
        bulletList(doc, p.bullets);
      });
    }
    if (data.education.length) {
      sectionHeading(doc, 'Education');
      data.education.forEach((e) => {
        entryHeader(doc, e.title, e.dates);
        if (e.detail) paragraph(doc, e.detail);
        doc.moveDown(0.3);
      });
    }
    if (data.certifications.length) {
      sectionHeading(doc, 'Certifications');
      bulletList(doc, data.certifications);
    }
  });

const coverLetterPdf = (data, letter, dateText) =>
  render({ Title: `${data.name} - Cover Letter`, Author: data.name }, (doc) => {
    nameBlock(doc, data);
    doc.moveDown(1.2);
    doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(dateText, M.left, doc.y, { width: contentWidth(doc) });
    doc.moveDown(1);

    letter.split(/\n{2,}/).forEach((block) => {
      doc.font('Helvetica').fontSize(10.5).fillColor(INK)
        .text(block.replace(/\n/g, '\n').trim(), M.left, doc.y, { width: contentWidth(doc), lineGap: 2.5 });
      doc.moveDown(0.8);
    });
  });

module.exports = { resumePdf, coverLetterPdf };