import { useState, useEffect } from "react";

export const DEFAULTS = {
  showLogs: true,
  showScale: true,
  showDelete: true,
  showExec: false,
  showDeployment: true,
  showEnvVars: true,
};

const STORAGE_KEY = "qatools_podpanel";
const EVENT = "qatools_podpanel_changed";

export function readSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeSettings(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event(EVENT));
}

export function useSettings() {
  const [settings, setSettings] = useState(readSettings);

  useEffect(() => {
    const handler = () => setSettings(readSettings());
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  return settings;
}
