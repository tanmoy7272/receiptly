# Document Text Extraction & OCR Guide

How document parsing works in Receiptly for PDFs, Word files, and images.

---

## Processing Strategy by Format

| Format | File Extension | Extraction Strategy | Tool / Package |
| :--- | :--- | :--- | :--- |
| **Digital PDF** | `.pdf` | Direct text buffer parsing | `pdf-parse` |
| **Word Document** | `.docx` | Native XML raw text extraction | `mammoth` |
| **Receipt Image** | `.jpg`, `.png`, `.webp` | Local WASM OCR / Groq Vision LLM | `tesseract.js` / Groq SDK |

---

## Technical Pipeline

1. **Text Extraction (`ocr.util.js`)**:
   - Reads incoming file buffer in memory without writing temporary disk files.
   - For PDFs, attempts fast text extraction using `pdf-parse`. If text length is < 10 characters (scanned image PDF), falls back to local Tesseract OCR.
   - For Word `.docx` files, extracts raw text using `mammoth` in ~2ms.
   - For receipt images, uses Tesseract WASM OCR or Groq Vision.

2. **Groq Model Routing (`ai.service.js`)**:
   - Extracted document text is passed to Groq `llama-3.3-70b-versatile` text prompt.
   - Images are passed to Groq `llama-3.3-70b-versatile` vision capabilities.

3. **Schema Validation (`ai.validator.js`)**:
   - Groq JSON response is validated via Zod schema (`aiExtractionSchema`), normalizing purchase dates to ISO `YYYY-MM-DD` format and categories to predefined enums.
