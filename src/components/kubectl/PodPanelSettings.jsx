import { DEFAULTS, writeSettings, useSettings } from "../../hooks/useSettings";

const LABELS = {
  showLogs: "Logs",
  showScale: "Scale replicas",
  showDelete: "Delete pod",
  showExec: "Exec / shell",
  showDeployment: "Deployment YAML",
  showEnvVars: "Env vars editor",
};

export default function PodPanelSettings() {
  const settings = useSettings();

  const toggle = (key) => writeSettings({ ...settings, [key]: !settings[key] });

  return (
    <div
      style={{
        background: "#f9f9f9",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: "#555" }}>
        Pod panel | visible sections
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
        {Object.keys(DEFAULTS).map((key) => (
          <label
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={settings[key]}
              onChange={() => toggle(key)}
            />
            {LABELS[key]}
          </label>
        ))}
      </div>
    </div>
  );
}
