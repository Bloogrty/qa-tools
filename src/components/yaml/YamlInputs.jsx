const sLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 8,
};

const area = {
  width: "100%",
  minHeight: 200,
  fontSize: 11,
  fontFamily: "monospace",
  padding: 10,
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  resize: "vertical",
  outline: "none",
};

export default function YamlInputs({ refText, targetText, onChange }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 16,
      }}
    >
      <div>
        <div style={sLabel}>Reference YAML (source of truth)</div>
        <textarea
          value={refText}
          onChange={(e) => onChange({ refText: e.target.value })}
          placeholder="Paste the reference Deployment YAML here (kubectl get deploy <name> -o yaml)..."
          spellCheck={false}
          style={area}
        />
      </div>
      <div>
        <div style={sLabel}>Target YAML (to be updated)</div>
        <textarea
          value={targetText}
          onChange={(e) => onChange({ targetText: e.target.value })}
          placeholder="Paste the target Deployment YAML here..."
          spellCheck={false}
          style={area}
        />
      </div>
    </div>
  );
}
