const {
  Document, Packer, Paragraph, TextRun, Tab, AlignmentType, TabStopType, BorderStyle,
} = require('docx');

const FONT = 'Calibri';
const CONTENT_W = 9906; // A4 width minus margins, in twips (used for the right-aligned dates)

const run = (text, opts = {}) => new TextRun({ text, font: FONT, size: 21, ...opts });

const heading = (text) =>
  new Paragraph({
    spacing: { before: 220, after: 80 },
    border: { bottom: { color: '9CA3AF', space: 1, style: BorderStyle.SINGLE, size: 6 } },
    children: [run(text.toUpperCase(), { bold: true, size: 22 })],
  });

const entryHeader = (title, dates) =>
  new Paragraph({
    spacing: { before: 100, after: 20 },
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
    children: [
      run(title, { bold: true }),
      ...(dates ? [new TextRun({ children: [new Tab(), dates], font: FONT, size: 20, color: '4B5563' })] : []),
    ],
  });

const bullets = (items) =>
  items.map((text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 30 }, children: [run(text)] }));

const plain = (text) => new Paragraph({ spacing: { after: 40 }, children: [run(text)] });

const nameBlock = (data) => [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [run(data.name, { bold: true, size: 40 })],
  }),
  ...(data.contact.length
    ? [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [run(data.contact.join('   |   '), { size: 19, color: '4B5563' })],
      })]
    : []),
];

const build = (title, author, children) =>
  Packer.toBuffer(
    new Document({
      creator: author,
      title,
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 800, bottom: 800, left: 1000, right: 1000 },
          },
        },
        children,
      }],
    })
  );

const resumeDocx = (data) => {
  const body = [...nameBlock(data)];

  if (data.summary) body.push(heading('Summary'), plain(data.summary));
  if (data.skills.length) body.push(heading('Skills'), plain(data.skills.join(', ')));
  if (data.experience.length) {
    body.push(heading('Experience'));
    data.experience.forEach((e) => body.push(entryHeader(e.title, e.dates), ...bullets(e.bullets)));
  }
  if (data.projects.length) {
    body.push(heading('Projects'));
    data.projects.forEach((p) => body.push(entryHeader(p.title, ''), ...bullets(p.bullets)));
  }
  if (data.education.length) {
    body.push(heading('Education'));
    data.education.forEach((e) => {
      body.push(entryHeader(e.title, e.dates));
      if (e.detail) body.push(plain(e.detail));
    });
  }
  if (data.certifications.length) body.push(heading('Certifications'), ...bullets(data.certifications));

  return build(`${data.name} - Resume`, data.name, body);
};

const coverLetterDocx = (data, letter, dateText) => {
  const body = [
    ...nameBlock(data),
    new Paragraph({ spacing: { before: 300, after: 200 }, children: [run(dateText, { color: '4B5563' })] }),
    ...letter
      .split(/\n{2,}/)
      .map((block) => new Paragraph({
        spacing: { after: 200, line: 300 },
        children: [run(block.trim(), { size: 22 })],
      })),
  ];
  return build(`${data.name} - Cover Letter`, data.name, body);
};

module.exports = { resumeDocx, coverLetterDocx };