const fs = require('fs');
const mammoth = require('mammoth');
// Importing the lib file directly avoids a known bug in pdf-parse's index.js
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const AppError = require('./AppError');

const extractText = async (filePath, fileType) => {
  let text = '';

  if (fileType === 'pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    text = data.text;
  } else {
    const result = await mammoth.extractRawText({ path: filePath });
    text = result.value;
  }

  // Collapse messy whitespace so the text is clean for the AI and the scorer
  text = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  if (text.length < 100) {
    throw new AppError(
      'We could not read text from this file. It may be a scanned image. Please upload a text-based PDF or DOCX.',
      422
    );
  }
  return text;
};

module.exports = extractText;