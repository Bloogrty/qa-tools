import { useState } from "react";
import jsYaml from "js-yaml";
import PageHeader from "../../components/common/PageHeader";
import ConflictPicker from "../../components/yaml/ConflictPicker";
import RadioGroup from "../../components/yaml/RadioGroup";
import SyncOptions from "../../components/yaml/SyncOptions";
import SyncSummary from "../../components/yaml/SyncSummary";
import YamlInputs from "../../components/yaml/YamlInputs";
import { YAML_MERGE_DEFAULT_STATE as DEFAULT_STATE } from "../../constants/defaultStates";
import { analyzeDeployments, renderEnvValue } from "../../utils/yamlSync";
import { buildMergedDoc, dumpMergedYaml } from "../../utils/yamlMerge";

const sLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 8,
};

const card = {
  background: "#f9f9f9",
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  padding: 14,
  marginBottom: 12,
};

const addedLine = {
  fontFamily: "monospace",
  fontSize: 11,
  color: "#dc2626",
  padding: "2px 0",
};

export default function YamlMergePage({ state, setState }) {
  const s = state || DEFAULT_STATE;
  const update = (patch) =>
    setState((prev) => ({ ...(prev || DEFAULT_STATE), ...patch }));

  const [yamlCopied, setYamlCopied] = useState(false);

  const {
    refText,
    targetText,
    result,
    error,
    envMode,
    envConflictChoice,
    ignoreEnvs,
    includeServiceAccountMount,
  } = s;

  const analyze = () => {
    try {
      update({
        error: "",
        result: analyzeDeployments(refText, targetText, {
          ignoreEnvs,
          includeServiceAccountMount,
        }),
        envConflictChoice: {},
      });
    } catch (e) {
      update({ error: e.message, result: null, envConflictChoice: {} });
    }
  };

  const buildFullYaml = () => {
    if (!result) return "";
    try {
      const merged = buildMergedDoc(jsYaml.load(refText), jsYaml.load(targetText), {
        envMode,
        envConflictChoices: envConflictChoice,
        ignoreEnvs,
        includeServiceAccountMount,
      });
      return dumpMergedYaml(merged);
    } catch {
      return "";
    }
  };

  const fullYaml = buildFullYaml();

  const copyYaml = () => {
    navigator.clipboard?.writeText(fullYaml);
    setYamlCopied(true);
    setTimeout(() => setYamlCopied(false), 1800);
  };

  return (
    <div style={{ padding: 16, maxWidth: 1600 }}>
      <PageHeader
        title="YAML Merge"
        subtitle="Get the full target Deployment YAML with env, volumes and mounts brought in from the reference"
      />

      <YamlInputs refText={refText} targetText={targetText} onChange={update} />

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ ...sLabel, marginBottom: 6 }}>Env mode</div>
          <RadioGroup
            name="merge-envMode"
            value={envMode}
            onChange={(v) => update({ envMode: v })}
            options={[
              { value: "add", label: "Add missing" },
              { value: "sync", label: "Sync values" },
              { value: "update", label: "Full merge" },
            ]}
          />
        </div>
        <SyncOptions
          name="merge"
          ignoreEnvs={ignoreEnvs}
          includeServiceAccountMount={includeServiceAccountMount}
          onChange={update}
        />
        <button
          onClick={analyze}
          style={{
            padding: "8px 20px",
            fontSize: 13,
            cursor: "pointer",
            background: "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
          }}
        >
          Parse
        </button>
        {result && (
          <button
            onClick={() =>
              update({
                refText: "",
                targetText: "",
                result: null,
                error: "",
                envConflictChoice: {},
              })
            }
            style={{
              padding: "8px 14px",
              fontSize: 13,
              cursor: "pointer",
              background: "#fff",
              color: "#555",
              border: "1px solid #e0e0e0",
              borderRadius: 6,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            color: "#dc2626",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <>
          <SyncSummary result={result} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div>
              <div style={sLabel}>Changes</div>

              <div style={card}>
                <div style={{ ...sLabel, marginBottom: 10 }}>Env vars</div>

                {envMode === "add" &&
                  (result.missingEnvs.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#16a34a" }}>No missing env vars</div>
                  ) : (
                    <div
                      style={{
                        maxHeight: 320,
                        overflowY: "auto",
                        border: "1px solid #eee",
                        borderRadius: 6,
                        background: "#fff",
                      }}
                    >
                      {result.missingEnvs.map((e) => (
                        <div
                          key={e.name}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "5px 10px",
                            borderBottom: "1px solid #f0f0f0",
                            fontSize: 12,
                            gap: 8,
                          }}
                        >
                          <span style={{ fontFamily: "monospace", fontWeight: 500, flexShrink: 0 }}>
                            {e.name}
                          </span>
                          <span
                            style={{
                              color: "#888",
                              fontFamily: "monospace",
                              fontSize: 11,
                              maxWidth: 180,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {renderEnvValue(e)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}

                {envMode !== "add" && (
                  <ConflictPicker
                    name="merge"
                    conflicts={result.conflictEnvs}
                    choices={envConflictChoice}
                    setChoices={(next) => update({ envConflictChoice: next })}
                  />
                )}
              </div>

              {result.missingMounts.length > 0 || result.missingVols.length > 0 ? (
                <div style={card}>
                  <div style={{ ...sLabel, marginBottom: 10 }}>Volumes & mounts</div>
                  {result.missingVols.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>
                        Volumes to add ({result.missingVols.length})
                      </div>
                      {result.missingVols.map((v) => (
                        <div key={v.name} style={addedLine}>
                          + {v.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.missingMounts.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>
                        Mounts to add ({result.missingMounts.length})
                      </div>
                      {result.missingMounts.map((m) => (
                        <div key={m.mountPath} style={addedLine}>
                          + {m.mountPath}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ ...card, color: "#16a34a", fontSize: 12, fontWeight: 500 }}>
                  All volumes and mounts already match.
                </div>
              )}
            </div>

            <div>
              <div style={sLabel}>Output YAML</div>
              <div
                onClick={copyYaml}
                style={{
                  position: "relative",
                  background: yamlCopied ? "#f0fdf4" : "#f5f5f5",
                  border: `1px solid ${yamlCopied ? "#86efac" : "#e0e0e0"}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  transition: "all .15s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 10,
                    whiteSpace: "nowrap",
                    color: yamlCopied ? "#16a34a" : "#999",
                    fontSize: 11,
                    userSelect: "none",
                    zIndex: 1,
                  }}
                >
                  {yamlCopied ? "✓ copied" : "copy"}
                </span>
                <textarea
                  value={fullYaml}
                  readOnly
                  spellCheck={false}
                  style={{
                    width: "100%",
                    minHeight: 600,
                    fontSize: 11,
                    fontFamily: "monospace",
                    padding: "8px 10px",
                    border: "none",
                    outline: "none",
                    resize: "vertical",
                    background: "transparent",
                    color: "#444",
                    lineHeight: 1.6,
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
