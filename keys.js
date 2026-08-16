function keys(url) {
  const labels = url.hostname.split(".");
  const segments = url.pathname.split("/");
  const hosts = [];
  const paths = [url.pathname];
  const list = [];

  while (labels.length) {
    hosts.push(hosts.length ? `*.${labels.join(".")}` : labels.join("."));
    labels.shift();
  }

  hosts.push("*");

  while (segments.length > 1) {
    segments.pop();
    paths.push(`${segments.join("/")}/*`);
  }

  paths.push("");

  for (const host of hosts) {
    for (const path of paths) {
      list.push(host + path);
    }
  }

  return list;
}

function envelope(text) {
  const slash = text.indexOf("/");
  const host = slash < 0 ? text : text.slice(0, slash);
  const path = slash < 0 ? "" : text.slice(slash);
  const star = host.lastIndexOf("*");
  const dot = host.indexOf(".", star + 1);

  return (star < 0 ? host : dot < 0 ? "*" : `*${host.slice(dot)}`)
    + (path.includes("*") ? `${path.slice(0, path.lastIndexOf("/", path.indexOf("*")) + 1)}*` : path);
}

function parse(text) {
  const slash = text.indexOf("/");
  const hostname = slash < 0 ? text : text.slice(0, slash);

  return new URLPattern(slash < 0 ? { hostname } : { hostname, pathname: text.slice(slash) });
}

function unpack(key, value) {
  return typeof value == "string" ? [[key, value]] : value;
}

function pack(key, list) {
  return list.length == 1 && list[0][0] == key ? list[0][1] : list;
}
