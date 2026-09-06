# AlwaysPDF Pro API

Server-side conversion API for AlwaysPDF Tools Pro features.

## Supported Now

- `POST /convert/word-to-pdf`
- `POST /convert/excel-to-pdf`
- `POST /convert/ppt-to-pdf`
- `POST /convert/pdf-to-word`
- `POST /convert/pdf-to-excel`
- `POST /convert/pdf-to-ppt`
- `POST /convert/searchable-pdf`
- `POST /convert/strong-compress`
- `POST /convert/pdf-to-pdfa`
- `GET /health`

## Local Run

Install LibreOffice, Ghostscript, OCRmyPDF, and Tesseract first. On macOS, the LibreOffice executable is usually `soffice`.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If `soffice` is not on PATH, set the full path in `.env`.

```env
ALWAYSPDF_SOFFICE_PATH=/opt/homebrew/bin/soffice
ALWAYSPDF_GS_PATH=gs
ALWAYSPDF_OCRMYPDF_PATH=ocrmypdf
```

## Docker Run

```bash
docker build -t alwayspdf-pro-api .
docker run -p 8000:8000 --env-file .env alwayspdf-pro-api
```

## VPS Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
curl http://127.0.0.1:8000/health
```

The compose file binds the API to `127.0.0.1:8000`. Put Nginx or Caddy in front of it for HTTPS.

Example Nginx config:

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/alwayspdf-pro-api
sudo ln -s /etc/nginx/sites-available/alwayspdf-pro-api /etc/nginx/sites-enabled/alwayspdf-pro-api
sudo nginx -t
sudo systemctl reload nginx
```

Then issue HTTPS with Certbot or your VPS panel.

## Request

Send `multipart/form-data`:

- `file`: source document
- `conversionType`: optional from the extension payload

Example:

```bash
curl -F "file=@sample.docx" http://localhost:8000/convert/word-to-pdf -o sample.pdf
curl -F "file=@sample.pptx" http://localhost:8000/convert/ppt-to-pdf -o sample.pdf
curl -F "file=@sample.pdf" http://localhost:8000/convert/pdf-to-word -o sample.docx
curl -F "file=@sample.pdf" http://localhost:8000/convert/pdf-to-excel -o sample.xlsx
curl -F "file=@sample.pdf" http://localhost:8000/convert/pdf-to-ppt -o sample.pptx
curl -F "file=@sample.pdf" http://localhost:8000/convert/searchable-pdf -o sample.searchable.pdf
curl -F "file=@sample.pdf" http://localhost:8000/convert/strong-compress -o sample.compressed.pdf
curl -F "file=@sample.pdf" http://localhost:8000/convert/pdf-to-pdfa -o sample.pdfa.pdf
```

## Extension Setup

In the extension root:

```env
VITE_PRO_API_BASE_URL=https://api.example.com
```

Add the exact API origin to `public/manifest.json` before building:

```json
"host_permissions": [
  "https://api.example.com/"
]
```

Do not use `<all_urls>` for this API.

For local API testing from a built extension, you can temporarily use:

```env
VITE_PRO_API_BASE_URL=http://127.0.0.1:8000
```

and add:

```json
"host_permissions": [
  "http://127.0.0.1:8000/"
]
```

Use HTTPS for production.

## VPS Notes

- Put the API behind HTTPS using Nginx/Caddy.
- Keep upload limits conservative at first.
- The API stores files in a per-request temp directory.
- Source and converted files are deleted after each response is sent.
- Run LibreOffice in an isolated service/container for production.
- Set `ALWAYSPDF_ALLOWED_ORIGINS` to the extension origin or your landing/app domain once production URLs are known.
