chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'alwasy-pdf-tools',
    title: 'AlwaysPDF Tools로 열기',
    contexts: ['link'],
    documentUrlPatterns: ['<all_urls>'],
  })
})

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'alwasy-pdf-tools' && info.linkUrl) {
    const url = chrome.runtime.getURL(`src/pages/index.html`)
    chrome.tabs.create({ url })
  }
})
