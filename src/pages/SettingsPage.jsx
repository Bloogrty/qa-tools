import { useState } from "react";
import PageHeader from "../components/common/PageHeader";
import PodPanelSettings from "../components/kubectl/PodPanelSettings";
import {
  WORKSPACE_DEFAULTS,
  parseList,
  readWorkspace,
  writeWorkspace,
} from "../utils/workspace";

const sLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 6,
};

const hint = { fontSize: 11, color: "#aaa", marginTop: 6, lineHeight: 1.5 };

const area = {
  width: "100%",
  minHeight: 140,
  fontSize: 12,
  fontFamily: "monospace",
  padding: 10,
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  resize: "vertical",
};

const btn = (primary) => ({
  padding: "7px 16px",
  fontSize: 13,
  cursor: "pointer",
  borderRadius: 6,
  border: primary ? "none" : "1px solid #e0e0e0",
  background: primary ? "#1a1a1a" : "#fff",
  color: primary ? "#fff" : "#555",
});

const toText = (list) => list.join("\n");

export default function SettingsPage() {
  const [nsText, setNsText] = useState(() => toText(readWorkspace().namespaces));
  const [cliText, setCliText] = useState(() => toText(readWorkspace().clis));
  const [saved, setSaved] = useState(false);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const save = () => {
    writeWorkspace({ namespaces: parseList(nsText), clis: parseList(cliText) });
    const ws = readWorkspace();
    setNsText(toText(ws.namespaces));
    setCliText(toText(ws.clis));
    flashSaved();
  };

  const reset = () => {
    writeWorkspace(WORKSPACE_DEFAULTS);
    setNsText(toText(WORKSPACE_DEFAULTS.namespaces));
    setCliText(toText(WORKSPACE_DEFAULTS.clis));
    flashSaved();
  };

  return (
    <div style={{ padding: 16, maxWidth: 820 }}>
      <PageHeader
        title="Settings"
        subtitle="Saved in this browser."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={sLabel}>Namespaces</div>
          <textarea
            value={nsText}
            onChange={(e) => setNsText(e.target.value)}
            spellCheck={false}
            style={area}
          />
          <div style={hint}>
            One per line (or comma separated). The first one is the default.
          </div>
        </div>
        <div>
          <div style={sLabel}>CLI commands</div>
          <textarea
            value={cliText}
            onChange={(e) => setCliText(e.target.value)}
            spellCheck={false}
            style={area}
          />
          <div style={hint}>
            One per line. Each is used as the start of every command, so it can
            carry flags, e.g. <code>kubectl --context=staging</code>. With more
            than one, tools show a CLI switch.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
        <button onClick={save} style={btn(true)}>
          Save
        </button>
        <button onClick={reset} style={btn(false)}>
          Reset to defaults
        </button>
        {saved && <span style={{ fontSize: 12, color: "#16a34a" }}>✓ Saved</span>}
      </div>

      <div style={sLabel}>Kubectl Console</div>
      <PodPanelSettings />
    </div>
  );
}
