const fs = require('fs');
const path = require('path');

/**
 * Extract plain text from PDF buffer or file path
 */
async function extractTextFromPdf(filePathOrBuffer) {
  let buffer;
  if (Buffer.isBuffer(filePathOrBuffer)) {
    buffer = filePathOrBuffer;
  } else if (typeof filePathOrBuffer === 'string') {
    if (!fs.existsSync(filePathOrBuffer)) {
      throw new Error('Resume file does not exist on server.');
    }
    buffer = fs.readFileSync(filePathOrBuffer);
  } else {
    throw new Error('Invalid input: expected Buffer or file path string.');
  }

  try {
    const pdfModule = require('pdf-parse');
    
    // Check if new class-based API (pdf-parse v2)
    if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      return cleanExtractedText(result.text || '');
    }

    // Fallback to function call (pdf-parse v1)
    if (typeof pdfModule === 'function') {
      const result = await pdfModule(buffer);
      return cleanExtractedText(result.text || '');
    }

    throw new Error('Unrecognized pdf-parse export structure.');
  } catch (error) {
    console.error('[ResumeService] PDF parsing failed:', error.message);
    throw new Error(`Failed to extract text from PDF resume: ${error.message}`);
  }
}

/**
 * Clean extracted text for downstream evidence processing
 */
function cleanExtractedText(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove non-printable characters
    .replace(/\n{3,}/g, '\n\n') // normalize excessive newlines
    .trim();
}

/**
 * Basic entity and keyword extraction heuristics from resume text
 */
function extractResumeKeywords(text) {
  if (!text) return { extractedSkills: [], detectedLinks: [] };

  const commonTechSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift',
    'React', 'React.js', 'Next.js', 'Vue', 'Vue.js', 'Angular', 'HTML5', 'HTML', 'CSS3', 'CSS', 'TailwindCSS',
    'Node.js', 'Express', 'Express.js', 'Nest.js', 'Django', 'FastAPI', 'Flask', 'Spring Boot',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite', 'Firebase', 'Oracle',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Git', 'GitHub', 'Linux',
    'REST', 'RESTful APIs', 'GraphQL', 'Microservices', 'Jest', 'Mocha',
    'Machine Learning', 'Data Analysis', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch',
  ];

  const foundSkills = new Set();
  for (const skill of commonTechSkills) {
    // Word boundary regex
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[\\s,;:.()/-])${escaped}(?=[\\s,;:.()/-]|$)`, 'i');
    if (regex.test(text)) {
      foundSkills.add(skill);
    }
  }

  // Detect public profile links inside resume text
  const detectedLinks = [];
  const githubMatch = text.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/gi);
  if (githubMatch) detectedLinks.push(...githubMatch);

  const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi);
  if (linkedinMatch) detectedLinks.push(...linkedinMatch);

  return {
    extractedSkills: Array.from(foundSkills),
    detectedLinks: Array.from(new Set(detectedLinks)),
  };
}

/**
 * Format safe file metadata to return to client (omitting private filesystem paths)
 */
function formatSafeFileMetadata(file) {
  if (!file) return null;
  return {
    originalName: file.originalname,
    filename: file.filename,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date(),
  };
}

module.exports = {
  extractTextFromPdf,
  cleanExtractedText,
  extractResumeKeywords,
  formatSafeFileMetadata,
};
