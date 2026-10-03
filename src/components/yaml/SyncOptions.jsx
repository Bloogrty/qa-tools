import RadioGroup from "./RadioGroup";

const sLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

export default function SyncOptions({ name, ignoreEnvs, includeServiceAccountMount, onChange }) {
  return (
    <>
      <div>
        <div style={{ ...sLabel, marginBottom: 4 }}>
          Ignore env vars
          <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 4 }}>
            (comma or newline separated)
          </span>
        </div>
        <textarea
          value={ignoreEnvs}
          onChange={(e) => onChange({ ignoreEnvs: e.target.value })}
          placeholder="e.g. HOSTNAME, LOG_LEVEL"
          style={{
            width: 300,
            height: 52,
            fontSize: 11,
            fontFamily: "monospace",
            padding: "6px 8px",
            border: "1px solid #e0e0e0",
            borderRadius: 6,
            resize: "vertical",
            outline: "none",
          }}
        />
      </div>
      <div>
        <div style={{ ...sLabel, marginBottom: 6 }}>Service account mount</div>
        <RadioGroup
          name={`${name}-svcAccountMount`}
          value={includeServiceAccountMount ? "include" : "exclude"}
          onChange={(v) => onChange({ includeServiceAccountMount: v === "include" })}
          options={[
            { value: "exclude", label: "Exclude" },
            { value: "include", label: "Include" },
          ]}
        />
      </div>
    </>
  );
}
