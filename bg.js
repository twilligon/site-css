chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

chrome.runtime.onMessage.addListener(async ({ oldCss, newCss }, sender) => {
  const target = { tabId: sender.tab.id, documentIds: [sender.documentId] };

  await Promise.all(oldCss.map(css => chrome.scripting.removeCSS({ target, css, origin: "USER" })));

  for (const css of newCss) {
    await chrome.scripting.insertCSS({ target, css, origin: "USER" });
  }
});
