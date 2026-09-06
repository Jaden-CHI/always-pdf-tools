# Chrome Web Store Submission Notes

## Product

- Name: AlwaysPDF Tools
- Category: Productivity
- Website: https://lunafrost-landing.vercel.app
- Privacy Policy: https://aimoonyth.com/privacy-policy/

## Short Description

브라우저에서 PDF 병합, 분할, 압축, 변환, 서명, OCR, 뷰어, 편집을 처리하는 PDF 도구 모음입니다.

## Detailed Description

AlwaysPDF Tools는 PDF 작업을 빠르게 처리할 수 있는 Chrome 확장 프로그램입니다.

주요 기능:

- PDF 합치기, 분할, 압축
- PDF 페이지 회전, 정리, 자르기, 페이지 번호 추가
- PDF 뷰어와 간단한 PDF 편집
- PDF 서명, 워터마크, 메타데이터 제거
- PDF와 이미지 간 변환
- OCR 텍스트 추출
- PDF → Word, PDF → Excel, PDF → PowerPoint
- Word, Excel, PowerPoint → PDF
- 검색 가능한 PDF 만들기
- PDF/A 변환
- 강력 압축

개인정보 및 파일 처리:

- 무료 기능은 사용자의 브라우저 안에서 로컬로 처리됩니다.
- Pro 서버 변환 기능은 사용자가 명시적으로 동의하고 변환을 시작한 경우에만 선택한 파일을 `https://api.memoham.com` 서버로 업로드합니다.
- 업로드된 파일은 변환 목적에만 사용되며, 변환 완료 후 원본과 결과 파일은 임시 저장소에서 자동 삭제됩니다.
- 파일 내용은 광고, 추적, 판매, 재판매 또는 별도 분석 목적으로 사용하지 않습니다.

## Permission Justifications

### `storage`

언어 설정, 라이트/다크 테마 같은 사용자 환경 설정을 브라우저에 저장하기 위해 사용합니다.

### `downloads`

변환 또는 편집이 완료된 PDF, DOCX, XLSX, PPTX, TXT 파일을 사용자의 기기에 저장하기 위해 사용합니다.

### `contextMenus`

사용자가 브라우저에서 확장 프로그램 도구를 빠르게 열 수 있는 우클릭 메뉴를 제공하기 위해 사용합니다.

### Host Permission: `https://api.memoham.com/`

PDF → Word, PDF → Excel, PDF → PowerPoint, Word/Excel/PowerPoint → PDF, 검색 가능한 PDF, PDF/A 변환, 강력 압축 같은 Pro 서버 변환 기능을 제공하기 위해 사용합니다.

이 권한은 `api.memoham.com`에만 제한되어 있으며, 사용자가 파일 업로드에 명시적으로 동의하고 Pro 변환을 실행한 경우에만 요청이 전송됩니다.

## Data Use Disclosure

### Does the extension collect or transmit user data?

Yes, but only for Pro server conversion features.

Free tools process files locally in the browser and do not upload files to a server. Pro conversion tools upload the selected file to `https://api.memoham.com` only after the user checks the consent box and starts conversion.

### What data is transmitted?

Only the file selected by the user for a Pro conversion request.

### Why is it transmitted?

Some high-quality conversions require server-side tools such as LibreOffice, Ghostscript, OCRmyPDF, Tesseract, and PDF conversion libraries that cannot reliably run inside a Chrome extension.

### Is the data shared with third parties?

No. Files are sent only to the AlwaysPDF Tools conversion API operated at `api.memoham.com`.

### How long is data retained?

Uploaded source files and generated output files are stored temporarily during conversion and deleted automatically after the response is sent.

## Free vs Pro

Free local features:

- PDF 합치기
- PDF 분할
- PDF 압축
- PDF → 이미지
- 이미지 → PDF
- 페이지 회전
- 페이지 정리
- PDF 서명
- 워터마크
- 비밀번호 해제
- 메타데이터 제거
- OCR 텍스트 추출
- PDF 뷰어
- PDF 편집
- 페이지 번호
- PDF 자르기
- PDF → Text

Pro server features:

- PDF → Word
- PDF → Excel
- PDF → PowerPoint
- Word → PDF
- Excel → PDF
- PowerPoint → PDF
- 검색 가능한 PDF
- 강력 압축
- PDF/A 변환

## Payment Plan

Payment and license verification are not implemented yet.

Recommended next implementation:

1. Add account or license-key verification.
2. Add payment provider such as Stripe or Toss Payments.
3. Issue a license token after payment.
4. Validate the token before Pro API conversion.
5. Add usage limits by account, license, or monthly quota.

Until payment is implemented, Pro tools can remain technically available for testing or be gated with a simple license-key flag.
