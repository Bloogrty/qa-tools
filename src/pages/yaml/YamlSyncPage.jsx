import CmdBox from "../../components/common/CmdBox";
import PageHeader from "../../components/common/PageHeader";
import Badge from "../../components/yaml/Badge";
import ConflictPicker from "../../components/yaml/ConflictPicker";
import RadioGroup from "../../components/yaml/RadioGroup";
import SyncOptions from "../../components/yaml/SyncOptions";
import SyncSummary from "../../components/yaml/SyncSummary";
import YamlInputs from "../../components/yaml/YamlInputs";
import { YAML_SYNC_DEFAULT_STATE as DEFAULT_STATE } from "../../constants/defaultStates";
import {
  analyzeDeployments,
  renderEnvValue,
  envEntryToYaml,
  volumeToYaml,
  volumeMountToYaml,
} from "../../utils/yamlSync";

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

const list = {
  overflowY: "auto",
  border: "1px solid #eee",
  borderRadius: 6,
  background: "#fff",
};

const listRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "5px 10px",
  borderBottom: "1px solid #f0f0f0",
  fontSize: 12,
  gap: 8,
};

const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

function SplitView({ left, right, rightLabel }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14,
        alignItems: "start",
      }}
    >
      <div style={{ minWidth: 0 }}>{left}</div>
      <div style={{ minWidth: 0, position: "sticky", top: 8 }}>
        {rightLabel && <div style={{ ...sLabel, marginBottom: 6 }}>{rightLabel}</div>}
        {right}
      </div>
    </div>
  );
}

export default function YamlSyncPage({ state, setState }) {
  const s = state || DEFAULT_STATE;
  const update = (patch) =>
    setState((prev) => ({ ...(prev || DEFAULT_STATE), ...patch }));

  const {
    refText,
    targetText,
    result,
    error,
    activeSection,
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

  const targetEnvWithChoices = () => {
    const { targetEnvMap, conflictEnvs } = result;
    const picked = {};
    for (const c of conflictEnvs) {
      picked[c.name] = envConflictChoice[c.name] === "ref" ? c.ref : c.target;
    }
    return targetEnvMap.order.map((name) =>
      envEntryToYaml(picked[name] || targetEnvMap.map[name]),
    );
  };

  const missingEnvYaml = () =>
    result.missingEnvs.map((e) => envEntryToYaml(e)).join("\n");

  const syncValuesEnvYaml = () => targetEnvWithChoices().join("\n");

  const mergedEnvYaml = () =>
    [...targetEnvWithChoices(), ...result.missingEnvs.map((e) => envEntryToYaml(e))].join(
      "\n",
    );

  const missingVolumesYaml = () =>
    "      volumes:\n" + result.missingVols.map((v) => volumeToYaml(v)).join("\n");

  const missingMountsYaml = () =>
    "          volumeMounts:\n" +
    result.missingMounts.map((m) => volumeMountToYaml(m)).join("\n");

  const unresolvedConflicts = result
    ? result.conflictEnvs.filter((c) => !envConflictChoice[c.name]).length
    : 0;

  const conflictPicker = () => (
    <ConflictPicker
      name="sync"
      conflicts={result.conflictEnvs}
      choices={envConflictChoice}
      setChoices={(next) => update({ envConflictChoice: next })}
    />
  );

  const tabBtn = (key, label) => (
    <button
      onClick={() => update({ activeSection: key })}
      style={{
        padding: "6px 14px",
        fontSize: 13,
        cursor: "pointer",
        border: "1px solid #e0e0e0",
        borderRadius: 6,
        background: activeSection === key ? "#1a1a1a" : "#fff",
        color: activeSection === key ? "#fff" : "#1a1a1a",
        fontWeight: activeSection === key ? 500 : 400,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ padding: 16, maxWidth: 1400 }}>
      <PageHeader
        title="YAML Sync"
        subtitle="Compare two Deployment YAMLs and copy the env, volume and mount snippets the target is missing"
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
        <SyncOptions
          name="sync"
          ignoreEnvs={ignoreEnvs}
          includeServiceAccountMount={includeServiceAccountMount}
          onChange={update}
        />
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

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {tabBtn(
              "env",
              `Env Vars (${result.missingEnvs.length + result.conflictEnvs.length} issues)`,
            )}
            {tabBtn("volumes", `Volumes & Mounts (${result.missingMounts.length} missing)`)}
          </div>

          {activeSection === "env" && (
            <div style={card}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 14,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 12, color: "#555", fontWeight: 500 }}>Mode:</span>
                <RadioGroup
                  name="sync-envMode"
                  value={envMode}
                  onChange={(v) => update({ envMode: v })}
                  options={[
                    { value: "add", label: "Add missing" },
                    { value: "sync", label: "Sync values" },
                    { value: "update", label: "Full merge" },
                  ]}
                />
                <span style={{ fontSize: 11, color: "#888" }}>
                  {envMode === "add" &&
                    `→ Only the ${result.missingEnvs.length} missing var(s)`}
                  {envMode === "sync" &&
                    `→ Target vars only (${result.targetEnvMap.order.length}), ref values where chosen`}
                  {envMode === "update" &&
                    `→ Full env block (${result.targetEnvMap.order.length + result.missingEnvs.length} vars)`}
                </span>
                {envMode !== "add" && result.conflictEnvs.length > 0 && (
                  <Badge color={unresolvedConflicts === 0 ? "green" : "amber"}>
                    {unresolvedConflicts === 0
                      ? "All conflicts resolved"
                      : `${unresolvedConflicts}/${result.conflictEnvs.length} conflicts using target`}
                  </Badge>
                )}
              </div>

              {envMode === "add" &&
                (result.missingEnvs.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#16a34a" }}>
                    ✓ No missing env vars, the target has every var from ref.
                  </div>
                ) : (
                  <SplitView
                    rightLabel={
                      <>
                        Paste under <code>env:</code> in the target
                      </>
                    }
                    left={
                      <>
                        <div style={sLabel}>
                          Missing ({result.missingEnvs.length}) | in ref but not in target
                        </div>
                        <div style={{ ...list, maxHeight: 520 }}>
                          {result.missingEnvs.map((e) => (
                            <div key={e.name} style={listRow}>
                              <span style={{ fontFamily: "monospace", fontWeight: 500, flexShrink: 0 }}>
                                {e.name}
                              </span>
                              <span
                                style={{
                                  ...ellipsis,
                                  color: "#888",
                                  fontFamily: "monospace",
                                  fontSize: 11,
                                  maxWidth: 240,
                                }}
                              >
                                {renderEnvValue(e)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    }
                    right={<CmdBox cmd={missingEnvYaml()} />}
                  />
                ))}

              {envMode === "sync" && (
                <SplitView
                  rightLabel="Target env block with ref values applied (no new vars)"
                  left={conflictPicker()}
                  right={<CmdBox cmd={syncValuesEnvYaml()} />}
                />
              )}

              {envMode === "update" && (
                <SplitView
                  rightLabel="Full merged env block (replaces the target's env:)"
                  left={
                    <>
                      {conflictPicker()}
                      <div style={{ ...sLabel, marginBottom: 6 }}>
                        Will be added ({result.missingEnvs.length})
                      </div>
                      {result.missingEnvs.length === 0 ? (
                        <div style={{ fontSize: 12, color: "#888" }}>
                          None, the target has every var from ref.
                        </div>
                      ) : (
                        <div style={{ ...list, maxHeight: 140, fontSize: 11 }}>
                          {result.missingEnvs.map((e) => (
                            <div
                              key={e.name}
                              style={{
                                padding: "3px 10px",
                                borderBottom: "1px solid #f0f0f0",
                                fontFamily: "monospace",
                              }}
                            >
                              {e.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  }
                  right={<CmdBox cmd={mergedEnvYaml()} />}
                />
              )}
            </div>
          )}

          {activeSection === "volumes" && (
            <>
              {result.missingMounts.length > 0 ? (
                <>
                  <div style={card}>
                    <div style={{ ...sLabel, marginBottom: 10 }}>
                      Missing volumeMounts ({result.missingMounts.length})
                    </div>
                    <SplitView
                      rightLabel={
                        <>
                          Paste under <code>volumeMounts:</code>
                        </>
                      }
                      left={
                        <div style={{ ...list, maxHeight: 420 }}>
                          {result.missingMounts.map((m) => (
                            <div key={m.mountPath} style={listRow}>
                              <span style={{ ...ellipsis, fontFamily: "monospace", fontWeight: 500 }}>
                                {m.mountPath}
                              </span>
                              <span
                                style={{
                                  color: "#888",
                                  fontFamily: "monospace",
                                  fontSize: 11,
                                  flexShrink: 0,
                                }}
                              >
                                {m.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      }
                      right={<CmdBox cmd={missingMountsYaml()} />}
                    />
                  </div>

                  <div style={card}>
                    <div style={{ ...sLabel, marginBottom: 10 }}>
                      Missing volumes ({result.missingVols.length}) | needed by the
                      missing mounts
                    </div>
                    {result.missingVols.length > 0 ? (
                      <SplitView
                        rightLabel={
                          <>
                            Paste under <code>volumes:</code>
                          </>
                        }
                        left={
                          <div style={{ ...list, maxHeight: 420 }}>
                            {result.missingVols.map((v) => (
                              <div key={v.name} style={listRow}>
                                <span style={{ fontFamily: "monospace", fontWeight: 500 }}>
                                  {v.name}
                                </span>
                                <span style={{ color: "#888", fontSize: 11 }}>
                                  {v.secret
                                    ? `secret: ${v.secret.secretName}`
                                    : v.configMap
                                      ? `configMap: ${v.configMap.name}`
                                      : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        }
                        right={<CmdBox cmd={missingVolumesYaml()} />}
                      />
                    ) : (
                      <div style={{ fontSize: 12, color: "#888" }}>
                        All required volumes already exist in the target (volume
                        names match).
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ ...card, color: "#16a34a", fontWeight: 500, fontSize: 13 }}>
                  ✓ All volumeMounts from ref already exist in the target
                </div>
              )}

              {result.extraMounts.length > 0 && (
                <div style={card}>
                  <div style={{ ...sLabel, marginBottom: 10 }}>
                    Extra volumeMounts in target, not in ref ({result.extraMounts.length})
                    | FYI only
                  </div>
                  {result.extraMounts.map((m) => (
                    <div key={m.mountPath} style={{ ...listRow, padding: "4px 8px" }}>
                      <span style={{ fontFamily: "monospace" }}>{m.mountPath}</span>
                      <span style={{ color: "#888", fontFamily: "monospace", fontSize: 11 }}>
                        {m.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
