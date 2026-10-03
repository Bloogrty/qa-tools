import jsYaml from "js-yaml";

function toCRLF(s) {
  return s.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
}

export const listCmd = (cli, ns) => `${cli} get configmap -n ${ns}`;

export const describeCmd = (cli, ns, name) =>
  `${cli} describe configmap ${name} -n ${ns}`;

export const yamlCmd = (cli, ns, name) =>
  `${cli} get configmap ${name} -n ${ns} -o yaml`;

export const editCmd = (cli, ns, name) =>
  `${cli} edit configmap ${name} -n ${ns}`;

export const rolloutRestartCmd = (cli, ns, deploy) =>
  `${cli} rollout restart deployment/${deploy} -n ${ns}`;

export const scaleRestartCmd = (cli, ns, deploy) =>
  `${cli} -n ${ns} scale deploy ${deploy} --replicas=0\n` +
  `${cli} -n ${ns} scale deploy ${deploy} --replicas=1`;

export function parseConfigMapList(raw) {
  return raw
    .trim()
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("NAME"))
    .map((l) => {
      const first = l.trim().split(/\s+/)[0];
      return first.includes("/") ? first.split("/")[1] : first;
    })
    .filter(Boolean);
}

export function validateJson(text) {
  if (!text.trim()) return null;
  try {
    JSON.parse(text);
    return null;
  } catch (e) {
    return e.message;
  }
}

export function prettyJson(text) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export function cleanJson(text) {
  if (!text.trim()) return text;
  // drop literal \r left before line breaks
  const t = text.replace(/\\r(?=\r?\n|$)/g, "").trim();
  try {
    let parsed = JSON.parse(t);
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return t;
  }
}

export function toDataScalar(jsonText) {
  return JSON.stringify(toCRLF(jsonText));
}

export function buildConfigMap({ name, namespace, dataKey, jsonText }) {
  const doc = {
    kind: "ConfigMap",
    apiVersion: "v1",
    metadata: { name, namespace },
    data: { [dataKey]: toCRLF(jsonText) },
  };
  return jsYaml.dump(doc, { lineWidth: -1 });
}

export function parseConfigMap(yamlText) {
  const doc = jsYaml.load(yamlText);
  if (!doc || typeof doc !== "object") throw new Error("Empty or invalid YAML");
  if (doc.kind !== "ConfigMap")
    throw new Error("Not a ConfigMap (kind must be ConfigMap)");
  return { doc, data: doc.data || {} };
}

export function dumpConfigMap(doc, data) {
  const out = { ...doc, data: {} };
  for (const [k, v] of Object.entries(data)) {
    out.data[k] = typeof v === "string" ? toCRLF(v) : v;
  }
  return jsYaml.dump(out, { lineWidth: -1 });
}
