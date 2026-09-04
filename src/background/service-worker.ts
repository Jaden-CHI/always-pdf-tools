chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'always-pdf-tools',
      title: 'AlwaysPDF Tools로 열기',
      contexts: ['link'],
      documentUrlPatterns: ['<all_urls>'],
    })
  })
})

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'always-pdf-tools' && info.linkUrl) {
    const url = chrome.runtime.getURL(`src/pages/index.html`)
    chrome.tabs.create({ url })
  }
})
