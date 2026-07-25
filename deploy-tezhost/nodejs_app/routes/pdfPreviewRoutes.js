const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Temp directory for PDF files
const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * POST /api/pdf-preview
 * Accepts a base64-encoded PDF and returns a same-origin URL
 * Body: { pdfBase64: "<base64 string>" }
 * Response: { success: true, url: "/api/pdf-preview/<uuid>" }
 */
router.post('/', (req, res) => {
  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ success: false, message: 'pdfBase64 is required' });
    }

    const id = uuidv4();
    const filePath = path.join(TEMP_DIR, `${id}.pdf`);
    const buffer = Buffer.from(pdfBase64, 'base64');
    fs.writeFileSync(filePath, buffer);

    // Auto-cleanup after 5 minutes
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) { /* ignore */ }
    }, 5 * 60 * 1000);

    res.json({ success: true, url: `/api/pdf-preview/${id}` });
  } catch (error) {
    console.error('PDF preview error:', error);
    res.status(500).json({ success: false, message: 'Failed to process PDF' });
  }
});

/**
 * GET /api/pdf-preview/:id
 * Serves a previously uploaded PDF file
 */
router.get('/:id', (req, res) => {
  const filePath = path.join(TEMP_DIR, `${req.params.id}.pdf`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'PDF not found or expired' });
  }
  res.contentType('application/pdf');
  res.sendFile(filePath);
});

module.exports = router;
