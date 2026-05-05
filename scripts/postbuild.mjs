import fs from 'fs'
import path from 'path'

const dist = 'dist'

// popup의 asset 경로를 확인
const popupHtml = fs.readFileSync(`${dist}/src/popup/index.html`, 'utf-8')
const jsMatch = popupHtml.match(/src="([^"]+\.js)"/)
const cssMatch = popupHtml.match(/href="([^"]+\.css)"/)

if (!jsMatch || !cssMatch) {
  console.error('Could not find asset paths in popup HTML')
  process.exit(1)
}

// 상대 경로를 popup 기준에서 계산 (src/popup/index.html → ../../assets/...)
// pages는 src/pages/index.html 기준이므로 ../../assets/...가 동일
const jsRelative = jsMatch[1]  // e.g. ../../assets/xxx.js
const cssRelative = cssMatch[1]

// Full Page HTML 생성 (src/pages/index.html)
const pagesDir = `${dist}/src/pages`
fs.mkdirSync(pagesDir, { recursive: true })

const pagesHtml = `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AlwasyPDF Tools</title>
    <script type="module" crossorigin src="${jsRelative}"></script>
    <link rel="stylesheet" crossorigin href="${cssRelative}">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`

fs.writeFileSync(`${pagesDir}/index.html`, pagesHtml)
console.log('✓ Created dist/src/pages/index.html')

// manifest의 web_accessible_resources 업데이트
const manifestPath = `${dist}/manifest.json`
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
const war = manifest.web_accessible_resources?.[0]
if (war && !war.resources.includes('src/pages/index.html')) {
  war.resources.push('src/pages/index.html')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log('✓ Updated manifest web_accessible_resources')
}

console.log('✓ Postbuild complete')
