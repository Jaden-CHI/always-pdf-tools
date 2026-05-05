# AlwasyPDF Tools

브라우저에서 바로 PDF를 편집할 수 있는 크롬 확장 프로그램입니다.
모든 파일 처리는 로컬(브라우저 내)에서 이루어지며, 서버로 파일이 전송되지 않습니다.

## 기능

| 기능 | 설명 |
|---|---|
| PDF 합치기 | 여러 PDF를 하나로 병합 |
| PDF 분할 | PDF를 페이지 단위 또는 범위로 분할 |
| PDF 압축 | 파일 용량 최적화 |
| PDF → 이미지 | PDF 페이지를 JPG/PNG로 변환 |
| 이미지 → PDF | JPG/PNG 이미지를 PDF로 변환 |
| 페이지 회전 | 전체/홀수/짝수 페이지 회전 |
| 워터마크 | 텍스트 워터마크 추가 |
| 비밀번호 보호 | PDF 잠금/해제 |

## 크롬에서 바로 설치 (빌드 없이)

1. 이 저장소를 클론하거나 ZIP으로 다운로드
2. `chrome://extensions` 접속
3. 우측 상단 **개발자 모드** ON
4. **압축 해제된 확장 프로그램 로드** 클릭
5. `dist` 폴더 선택

## 개발 환경 설정

### 요구사항
- Node.js 18+
- pnpm

### 설치 및 빌드

```bash
# 의존성 설치
pnpm install

# 프로덕션 빌드
pnpm build
```

빌드 완료 후 `dist` 폴더를 크롬에 로드하세요.

## 기술 스택

- **React 19** + **TypeScript**
- **Vite 8** + **@crxjs/vite-plugin** (Manifest V3)
- **Tailwind CSS v4**
- **pdf-lib** — PDF 편집/병합/분할
- **pdfjs-dist** — PDF → 이미지 변환
- **lucide-react** — 아이콘

## 라이선스

MIT
