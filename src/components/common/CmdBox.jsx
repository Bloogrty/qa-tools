import { useState } from "react";

export default function CmdBox({ cmd, label }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ marginBottom: 6 }}>
      {label && (
        <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>{label}</div>
      )}
      <div
        onClick={copy}
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: copied ? "#f0fdf4" : "#f5f5f5",
          border: `1px solid ${copied ? "#86efac" : "#e0e0e0"}`,
          borderRadius: 6,
          padding: "8px 10px",
          cursor: "pointer",
          gap: 8,
          transition: "all .15s",
        }}
      >
        <span
          style={{
            flex: 1,
            fontFamily: "monospace",
            fontSize: 11,
            color: "#444",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            lineHeight: 1.6,
          }}
        >
          {cmd}
        </span>
        <span
          style={{
            whiteSpace: "nowrap",
            color: copied ? "#16a34a" : "#999",
            fontSize: 11,
            paddingTop: 1,
            flexShrink: 0,
          }}
        >
          {copied ? "✓ copied" : "copy"}
        </span>
      </div>
    </div>
  );
}
