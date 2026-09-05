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
- `conversionType`: one of `pdf-to-word`, `pdf-to-excel`, `word-to-pdf`, `excel-to-pdf`

Routes:

- `POST /convert/pdf-to-word`
- `POST /convert/pdf-to-excel`
- `POST /convert/word-to-pdf`
- `POST /convert/excel-to-pdf`

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
- PDF: `application/pdf`

## Server Requirements

- HTTPS only
- Randomized temporary file names
- File size and page limits
- Automatic deletion of source and result files
- Conversion execution isolated from the web process
- Clear error responses for unsupported files, password-protected files, and conversion failures

## Suggested VPS Engine

- Word/Excel to PDF: LibreOffice headless
- PDF to Word: `pdf2docx`
- PDF to Excel: `pdfplumber`, Camelot, or Tabula-style extraction
- Scanned PDFs: OCR pipeline before conversion
