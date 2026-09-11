# AlwaysPDF Tools Pro Conversion API

Chrome extension Pro conversions call a VPS API only after explicit user consent.

## Environment

Set the extension build variable:

```env
VITE_PRO_API_BASE_URL=https://api.example.com
```

When the real domain is chosen, add the exact origin to `public/manifest.json`:

```json
"host_permissions": [
  "https://api.example.com/"
]
```

Avoid broad host permissions such as `<all_urls>` for Pro conversion.

## Endpoints

All endpoints accept `multipart/form-data`.

Required fields:

- `file`: uploaded source file
- `conversionType`: one of `pdf-to-word`, `pdf-to-excel`, `pdf-to-ppt`, `word-to-pdf`, `excel-to-pdf`, `ppt-to-pdf`, `searchable-pdf`, `strong-compress`, `pdf-to-pdfa`

Routes:

- `POST /convert/pdf-to-word`
- `POST /convert/pdf-to-excel`
- `POST /convert/pdf-to-ppt`
- `POST /convert/word-to-pdf`
- `POST /convert/excel-to-pdf`
- `POST /convert/ppt-to-pdf`
- `POST /convert/searchable-pdf`
- `POST /convert/strong-compress`
- `POST /convert/pdf-to-pdfa`

## Response

On success, return the converted file body directly.

Headers:

```http
Content-Type: application/pdf
Content-Disposition: attachment; filename*=UTF-8''converted.pdf
```

Use the matching content type:

- DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- XLSX: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- PPTX: `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- PDF: `application/pdf`

## Server Requirements

- HTTPS only
- Randomized temporary file names
- File size and page limits
- Automatic deletion of source and result files
- Conversion execution isolated from the web process
- Clear error responses for unsupported files, password-protected files, and conversion failures

## Current VPS Engines

- Word/Excel to PDF: LibreOffice headless
- PowerPoint to PDF: LibreOffice headless
- PDF to Word: `pdf2docx`
- PDF to Excel: `pdfplumber` + `openpyxl`
- PDF to PowerPoint: PyMuPDF page rendering + `python-pptx`
- Strong compression: Ghostscript
- Searchable PDF / PDF/A: OCRmyPDF + Tesseract

## Optional Commercial Engine

Adobe PDF Services can be enabled for higher-quality PDF <-> Office conversions by setting:

```env
ALWAYSPDF_ADOBE_PDF_SERVICES_ENABLED=true
ALWAYSPDF_ADOBE_PDF_SERVICES_CLIENT_ID=your_adobe_client_id
ALWAYSPDF_ADOBE_PDF_SERVICES_CLIENT_SECRET=your_adobe_client_secret
```

When configured, these routes use Adobe first:

- `POST /convert/pdf-to-word`
- `POST /convert/pdf-to-excel`
- `POST /convert/pdf-to-ppt`
- `POST /convert/word-to-pdf`
- `POST /convert/excel-to-pdf`
- `POST /convert/ppt-to-pdf`

If Adobe credentials are missing, the API falls back to the built-in VPS engines.
