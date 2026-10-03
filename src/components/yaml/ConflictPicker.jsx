import RadioGroup from "./RadioGroup";
import { renderEnvValue } from "../../utils/yamlSync";

const sLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 8,
};

const panel = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 6,
};

const valueText = {
  fontFamily: "monospace",
  color: "#555",
  fontSize: 11,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export default function ConflictPicker({ name, conflicts, choices, setChoices }) {
  const choiceOf = (c) => choices[c.name] || "target";

  const first = conflicts[0] ? choiceOf(conflicts[0]) : "";
  const bulk = conflicts.every((c) => choiceOf(c) === first) ? first : "";

  const applyAll = (choice) =>
    setChoices(Object.fromEntries(conflicts.map((c) => [c.name, choice])));

  const option = (c, choice, color) => (
    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
      <input
        type="radio"
        name={`${name}-${c.name}`}
        checked={choiceOf(c) === choice}
        onChange={() => setChoices({ ...choices, [c.name]: choice })}
      />
      <span style={{ color, fontSize: 11, flexShrink: 0 }}>{choice}:</span>
      <span style={valueText}>{renderEnvValue(c[choice])}</span>
    </label>
  );

  return (
    <>
      <div style={sLabel}>
        Conflicts ({conflicts.length}) | pick which value to use
      </div>
      {conflicts.length === 0 ? (
        <div style={{ ...panel, fontSize: 12, color: "#888", padding: 8, marginBottom: 12 }}>
          No conflicts between ref and target.
        </div>
      ) : (
        <>
          <div
            style={{
              ...panel,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: "#555" }}>
              Apply to all:
            </span>
            <RadioGroup
              name={`${name}-bulk`}
              value={bulk}
              onChange={applyAll}
              options={[
                { value: "target", label: "Use target" },
                { value: "ref", label: "Use ref" },
              ]}
            />
            {bulk === "" && (
              <span style={{ fontSize: 11, color: "#888" }}>
                (mixed, pick one to override all)
              </span>
            )}
          </div>
          <div style={{ ...panel, maxHeight: 400, overflowY: "auto", marginBottom: 12 }}>
            {conflicts.map((c) => (
              <div
                key={c.name}
                style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0", fontSize: 12 }}
              >
                <div
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 600,
                    marginBottom: 6,
                    wordBreak: "break-all",
                  }}
                >
                  {c.name}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {option(c, "target", "#16a34a")}
                  {option(c, "ref", "#b45309")}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
