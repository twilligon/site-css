const overrides = document.getElementById("overrides");
const pattern = document.getElementById("pattern");

function valid(text) {
  if (!text || text.startsWith("/") || /[:{}()+?\\]/.test(text)) {
    return false;
  }

  try {
    parse(text);
  } catch {
    return false;
  }

  return true;
}

function patterns(key, value) {
  return value === undefined ? "" : unpack(key, value).map(([name]) => name).join("\n");
}

function update(key, name, css) {
  return chrome.storage.sync.get(key).then(saved => {
    const list = unpack(key, saved[key] ?? "").map(entry => entry[0] == name ? [name, css] : entry);
    return chrome.storage.sync.set({ [key]: pack(key, list) });
  });
}

function drop(key, name) {
  return chrome.storage.sync.get(key).then(saved => {
    const list = unpack(key, saved[key] ?? "").filter(entry => entry[0] != name);

    return list.length
      ? chrome.storage.sync.set({ [key]: pack(key, list) })
      : chrome.storage.sync.remove(key);
  });
}

function render() {
  chrome.storage.sync.get(null).then(saved => {
    const rows = Object.keys(saved)
      .flatMap(key => unpack(key, saved[key]).map(([name, css]) => [key, name, css]))
      .sort(([, a], [, b]) => a < b ? -1 : a > b ? 1 : 0);

    overrides.replaceChildren(...rows.map(([key, name, css]) => {
      const row = document.createElement("div");
      const head = document.createElement("header");
      const label = document.createElement("span");
      const editor = document.createElement("textarea");
      const remove = document.createElement("button");

      label.textContent = name;
      remove.textContent = "×";
      remove.addEventListener("click", () => drop(key, name));

      editor.value = css;
      editor.spellcheck = false;
      editor.placeholder = chrome.i18n.getMessage("css_placeholder");
      editor.addEventListener("input", () => update(key, name, editor.value));

      head.append(label, remove);
      row.append(head, editor);
      return row;
    }));
  });
}

document.title = chrome.i18n.getMessage("extension_name");

pattern.addEventListener("input", () => {
  pattern.setCustomValidity(valid(pattern.value) ? "" : chrome.i18n.getMessage("invalid_pattern"));
});

document.getElementById("add").addEventListener("submit", event => {
  const name = pattern.value;
  const key = envelope(name);

  event.preventDefault();
  pattern.value = "";

  chrome.storage.sync.get(key).then(saved => {
    const list = key in saved ? unpack(key, saved[key]) : [];

    if (!list.some(entry => entry[0] == name)) {
      chrome.storage.sync.set({ [key]: pack(key, [...list, [name, ""]]) });
    }
  });
});

chrome.storage.sync.onChanged.addListener(changes => {
  if (Object.entries(changes).some(([key, change]) =>
      patterns(key, change.oldValue) != patterns(key, change.newValue))) {
    render();
  }
});

render();
