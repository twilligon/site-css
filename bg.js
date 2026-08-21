browser.action.onClicked.addListener(() => browser.runtime.openOptionsPage());

browser.runtime.onMessage.addListener(async ({ oldCss, newCss }, sender) => {
  const target = { tabId: sender.tab.id, documentIds: [sender.documentId] };

  await Promise.all(oldCss.map(css => browser.scripting.removeCSS({ target, css, origin: "USER" })));

  for (const css of newCss) {
    await browser.scripting.insertCSS({ target, css, origin: "USER" });
  }
});
