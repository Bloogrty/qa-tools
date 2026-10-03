import { shq } from "./shell";
import { pick } from "./workspace";

export const RESOURCE_TYPES = ["deployment", "statefulset", "dc"];

export function resolveResource(r, { namespaces, clis }) {
  return {
    ...r,
    cli: pick(r.cli, clis),
    ns: pick(r.ns, namespaces),
    name: r.name.trim(),
  };
}

export function listEnvCmd(r) {
  return `${r.cli} set env ${r.type}/${r.name} -n ${r.ns} --list`;
}

export function setEnvCmd(r, pairs) {
  const lines = pairs.map((p) => `  ${p.key}=${shq(p.value)}`);
  return `${r.cli} set env ${r.type}/${r.name} -n ${r.ns} \\\n${lines.join(" \\\n")}`;
}

// valueFrom vars show up as "# KEY from secret name, key k"
export function parseEnvList(text) {
  const result = [];
  for (const raw of text.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) {
      const m = trimmed.match(/^#\s+(\S+)\s+(from\s+.*)$/);
      if (m) result.push({ key: m[1], value: null, source: m[2], isSecret: true });
    } else {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        result.push({
          key: trimmed.slice(0, eq),
          value: trimmed.slice(eq + 1),
          isSecret: false,
        });
      }
    }
  }
  return result;
}

export function diffEnvLists(refList, targetList) {
  const refMap = new Map(refList.map((e) => [e.key, e]));
  const targetMap = new Map(targetList.map((e) => [e.key, e]));
  const order = [...refMap.keys()];
  for (const key of targetMap.keys()) if (!refMap.has(key)) order.push(key);

  return order.map((key) => {
    const ref = refMap.get(key) || null;
    const target = targetMap.get(key) || null;
    let status;
    if (!ref) status = "extra";
    else if (!target) status = "missing";
    else if (
      ref.isSecret === target.isSecret &&
      (ref.isSecret ? ref.source === target.source : ref.value === target.value)
    )
      status = "same";
    else status = "changed";
    return { key, ref, target, status };
  });
}
