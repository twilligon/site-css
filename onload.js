const style = document.createElement("style");
const candidates = keys(location);

function apply() {
  return chrome.storage.sync.get(candidates).then(saved => {
    style.textContent = candidates
      .filter(candidate => candidate in saved)
      .reverse()
      .flatMap(key => unpack(key, saved[key])
        .filter(([pattern]) => pattern == key || parse(pattern).test(location.href))
        .map(([, css]) => css))
      .join("\n\n");

    if (!style.isConnected) {
      (document.head ?? document.documentElement).append(style);
    }
  });
}

chrome.storage.sync.onChanged.addListener(changes => {
  if (candidates.some(candidate => candidate in changes)) {
    apply();
  }
});

apply();
