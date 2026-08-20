const overrides = document.getElementById("overrides");
const pattern = document.getElementById("pattern");

function shortToURLPatternText(text) {
  return /^[^/]*:\/\//.test(text) ? text : `*://${text.replace(/^[^/]*/, "$&:*")}`;
}

function shortToURLPattern(text) {
  return new URLPattern(shortToURLPatternText(text));
}

function hostnameToKey(hostname) {
  return hostname.replace(/^.*[*:{}()+?\\][^.]*/, "*");
}

function pathnameToKey(pathname) {
  const path = pathname.replace(/\/[^/]*[*:{}()+?\\].*$/, "/*");

  return path.startsWith("/") ? path : "";
}

function URLPatternToKey(urlPattern) {
  return hostnameToKey(urlPattern.hostname) + pathnameToKey(urlPattern.pathname);
}

function equalQua(prototype, a, b) {
  return Object.keys(prototype).every(property => a[property] === b[property]);
}

function entryNames(value) {
  return value?.map(([name]) => name).join("\n") ?? "";
}

async function mutate(key, fn) {
  const saved = await chrome.storage.sync.get(key);
  const list = fn(saved[key] ?? []);

  if (list.length === 0) {
    chrome.storage.sync.remove(key);
  } else {
    chrome.storage.sync.set({ [key]: list });
  }
}

async function render() {
  const saved = await chrome.storage.sync.get(null);
  const rows = Object.entries(saved)
    .flatMap(([key, value]) => value.map(([name, css]) => [key, name, css]))
    .sort(([, a], [, b]) => a.localeCompare(b));

  overrides.replaceChildren(...rows.map(([key, name, css]) => {
    const row = document.createElement("div");
    const head = document.createElement("header");
    const editor = document.createElement("textarea");
    const remove = document.createElement("button");

    remove.textContent = "×";
    remove.addEventListener("click", () => mutate(key, list => list.filter(item => item[0] !== name)));

    editor.value = css;
    editor.spellcheck = false;
    editor.placeholder = chrome.i18n.getMessage("css_placeholder");
    editor.addEventListener("input", () =>
      mutate(key, list => list.map(item => item[0] === name ? [name, editor.value] : item)));

    head.append(name === key ? key : name, remove);
    row.append(head, editor);
    return row;
  }));
}

document.title = chrome.i18n.getMessage("extension_name");

pattern.addEventListener("input", () => {
  try {
    shortToURLPattern(pattern.value);
    pattern.setCustomValidity("");
  } catch {
    pattern.setCustomValidity(chrome.i18n.getMessage("invalid_pattern"));
  }
});

document.getElementById("add").addEventListener("submit", event => {
  event.preventDefault();

  const patternText = shortToURLPatternText(pattern.value);

  pattern.value = "";

  const parsed = new URLPattern(patternText);
  const key = URLPatternToKey(parsed);
  const keyPattern = shortToURLPattern(key);
  const name = equalQua(URLPattern.prototype, parsed, keyPattern) ? key : patternText;

  mutate(key, list => list.some(item => item[0] === name) ? list : [...list, [name, ""]]);
});

chrome.storage.sync.onChanged.addListener(changes => {
  if (Object.values(changes).some(change => entryNames(change.oldValue) !== entryNames(change.newValue))) {
    render();
  }
});

render();
