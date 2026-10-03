export const WORKSPACE_DEFAULTS = {
  namespaces: ["default", "staging", "production"],
  clis: ["kubectl", "oc"],
};

const STORAGE_KEY = "qatools_workspace";
export const WORKSPACE_EVENT = "qatools_workspace_changed";

export function parseList(text) {
  return [
    ...new Set(
      text
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}

export function pick(value, options) {
  return options.includes(value) ? value : options[0];
}

const nonEmpty = (list, fallback) =>
  Array.isArray(list) && list.length ? list : fallback;

export function readWorkspace() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return {
      namespaces: nonEmpty(saved.namespaces, WORKSPACE_DEFAULTS.namespaces),
      clis: nonEmpty(saved.clis, WORKSPACE_DEFAULTS.clis),
    };
  } catch {
    return { ...WORKSPACE_DEFAULTS };
  }
}

export function writeWorkspace(ws) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
  window.dispatchEvent(new Event(WORKSPACE_EVENT));
}
