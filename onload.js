function* hosts() {
  const labels = location.hostname.split(".");

  yield "*";

  for (let i = labels.length - 1; i > 0; i--) {
    yield `*.${labels.slice(i).join(".")}`;
  }

  yield location.hostname;
}

function* paths() {
  const segments = location.pathname.split("/");

  yield "";

  for (let i = 1; i < segments.length; i++) {
    yield `${segments.slice(0, i).join("/")}/*`;
  }

  yield location.pathname;
}

const keys = [];

for (const host of hosts()) {
  for (const path of paths()) {
    keys.push(host + path);
  }
}

let oldCss = [];

async function apply() {
  const saved = await browser.storage.sync.get(keys);
  const newCss = keys.flatMap(key => (saved[key] ?? [])
    .filter(([name]) => name === key || new URLPattern(name).test(location.href))
    .map(([, css]) => css));

  let same = 0;
  while (same < oldCss.length && same < newCss.length && oldCss[same] === newCss[same]) {
    same++;
  }

  if (same < oldCss.length || same < newCss.length) {
    browser.runtime.sendMessage({ oldCss: oldCss.slice(same), newCss: newCss.slice(same) });
    oldCss = newCss;
  }
}

browser.storage.sync.onChanged.addListener(changes => {
  if (keys.some(key => key in changes)) {
    apply();
  }
});

apply();
