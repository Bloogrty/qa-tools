import { useState, useMemo } from "react";
import CmdBox from "../../components/common/CmdBox";
import PageHeader from "../../components/common/PageHeader";
import Placeholder from "../../components/common/Placeholder";
import ResourcePicker from "../../components/env/ResourcePicker";
import { useWorkspace } from "../../hooks/useWorkspace";
import {
  resolveResource,
  listEnvCmd,
  setEnvCmd,
  parseEnvList,
  diffEnvLists,
} from "../../utils/envList";

const EMPTY_RESOURCE = { cli: "", ns: "", type: "deployment", name: "" };

const sLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 6,
};

const ROW_STYLE = {
  same: { bg: "transparent", text: "#333", badge: null },
  changed: {
    bg: "#fffbeb",
    text: "#92400e",
    badge: { bg: "#fef3c7", color: "#b45309", label: "changed" },
  },
  missing: {
    bg: "#f0fdf4",
    text: "#14532d",
    badge: { bg: "#dcfce7", color: "#15803d", label: "missing in target" },
  },
  extra: {
    bg: "#f5f5f5",
    text: "#888",
    badge: { bg: "#f0f0f0", color: "#888", label: "only in target" },
  },
};

const btnStyle = (active, activeColor) => ({
  padding: "3px 8px",
  fontSize: 11,
  cursor: "pointer",
  borderRadius: 6,
  border: `1px solid ${active ? activeColor || "#1a1a1a" : "#e0e0e0"}`,
  background: active ? activeColor || "#1a1a1a" : "#fff",
  color: active ? "#fff" : "#555",
});

const textarea = {
  width: "100%",
  minHeight: 160,
  fontSize: 11,
  fontFamily: "monospace",
  padding: 10,
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  resize: "vertical",
};

const muted = { fontSize: 11, color: "#aaa" };

function EnvValue({ entry }) {
  if (!entry) return <span style={{ color: "#ccc" }}>not present</span>;
  if (entry.isSecret)
    return (
      <span style={{ color: "#94a3b8", fontStyle: "italic" }}>{entry.source}</span>
    );
  return entry.value;
}

export default function EnvComparePage() {
  const ws = useWorkspace();
  const [refSide, setRefSide] = useState(EMPTY_RESOURCE);
  const [targetSide, setTargetSide] = useState(EMPTY_RESOURCE);
  const [refRaw, setRefRaw] = useState("");
  const [targetRaw, setTargetRaw] = useState("");
  const [refPicks, setRefPicks] = useState({});
  const [showSame, setShowSame] = useState(false);

  const ref = resolveResource(refSide, ws);
  const target = resolveResource(targetSide, ws);

  const rows = useMemo(() => {
    if (!refRaw.trim() || !targetRaw.trim()) return [];
    return diffEnvLists(parseEnvList(refRaw), parseEnvList(targetRaw));
  }, [refRaw, targetRaw]);

  const count = (status) => rows.filter((r) => r.status === status).length;
  const changedCount = count("changed");

  function batch(choice) {
    const next = {};
    for (const row of rows) {
      if (row.status === "changed" && !row.ref.isSecret) next[row.key] = choice;
    }
    setRefPicks(next);
  }

  const { pairs, manual } = useMemo(() => {
    const pairs = [];
    const manual = [];
    for (const row of rows) {
      const wanted =
        row.status === "missing" ||
        (row.status === "changed" && refPicks[row.key] === "ref");
      if (!wanted) continue;
      if (row.ref.isSecret) manual.push(row.key);
      else pairs.push({ key: row.key, value: row.ref.value });
    }
    return { pairs, manual };
  }, [rows, refPicks]);

  return (
    <div style={{ padding: 16 }}>
      <PageHeader
        title="Env Compare"
        subtitle="Compare the env vars of two workloads and build the command that brings the target in line"
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <ResourcePicker label="Reference (source of truth)" value={refSide} onChange={setRefSide} />
        <ResourcePicker label="Target (gets updated)" value={targetSide} onChange={setTargetSide} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={sLabel}>1. Get env</div>
        {ref.name || target.name ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>{ref.name && <CmdBox label="Reference" cmd={listEnvCmd(ref)} />}</div>
            <div>{target.name && <CmdBox label="Target" cmd={listEnvCmd(target)} />}</div>
          </div>
        ) : (
          <Placeholder>Fill in a name on either side above</Placeholder>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={sLabel}>2. Paste the output</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <textarea
            value={refRaw}
            onChange={(e) => {
              setRefRaw(e.target.value);
              setRefPicks({});
            }}
            placeholder="Paste the reference --list output here..."
            style={textarea}
          />
          <textarea
            value={targetRaw}
            onChange={(e) => {
              setTargetRaw(e.target.value);
              setRefPicks({});
            }}
            placeholder="Paste the target --list output here..."
            style={textarea}
          />
        </div>
      </div>

      {refRaw.trim() && targetRaw.trim() && rows.length === 0 && (
        <div style={{ textAlign: "center", padding: 32, fontSize: 13, color: "#aaa" }}>
          No env vars found in the pasted text
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={sLabel}>3. Review</div>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {[
              { label: "same", color: "#888", n: count("same") },
              { label: "changed", color: "#b45309", n: changedCount },
              { label: "missing in target", color: "#15803d", n: count("missing") },
              { label: "only in target", color: "#888", n: count("extra") },
            ].map((s) => (
              <span
                key={s.label}
                style={{
                  fontSize: 11,
                  color: s.color,
                  background: "#f9f9f9",
                  border: "1px solid #e0e0e0",
                  borderRadius: 99,
                  padding: "2px 10px",
                }}
              >
                {s.n} {s.label}
              </span>
            ))}
            {changedCount > 0 && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#888" }}>All changed:</span>
                <button onClick={() => batch("ref")} style={btnStyle(false)}>
                  use reference
                </button>
                <button onClick={() => setRefPicks({})} style={btnStyle(false)}>
                  keep target
                </button>
              </div>
            )}
            <label
              style={{
                fontSize: 11,
                color: "#888",
                display: "flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
                marginLeft: "auto",
              }}
            >
              <input
                type="checkbox"
                checked={showSame}
                onChange={(e) => setShowSame(e.target.checked)}
              />
              Show same
            </label>
          </div>

          <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "200px 1fr 1fr 200px",
                background: "#f5f5f5",
                borderBottom: "1px solid #e0e0e0",
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 600,
                color: "#888",
                gap: 8,
              }}
            >
              <span>Key</span>
              <span>Reference</span>
              <span>Target</span>
              <span>Action</span>
            </div>
            {rows
              .filter((r) => showSame || r.status !== "same")
              .map((row) => {
                const rs = ROW_STYLE[row.status];
                const picked = refPicks[row.key] === "ref";
                return (
                  <div
                    key={row.key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "200px 1fr 1fr 200px",
                      padding: "8px 12px",
                      borderBottom: "1px solid #f0f0f0",
                      background: rs.bg,
                      alignItems: "start",
                      gap: 8,
                      fontFamily: "monospace",
                      fontSize: 11,
                      wordBreak: "break-all",
                    }}
                  >
                    <div style={{ color: rs.text, fontWeight: 500 }}>
                      {row.key}
                      {rs.badge && (
                        <span
                          style={{
                            display: "block",
                            fontFamily: "system-ui, sans-serif",
                            fontSize: 10,
                            padding: "1px 6px",
                            borderRadius: 99,
                            background: rs.badge.bg,
                            color: rs.badge.color,
                            marginTop: 3,
                            width: "fit-content",
                          }}
                        >
                          {rs.badge.label}
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#444" }}>
                      <EnvValue entry={row.ref} />
                    </div>
                    <div style={{ color: "#444" }}>
                      <EnvValue entry={row.target} />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        flexWrap: "wrap",
                        fontFamily: "system-ui, sans-serif",
                      }}
                    >
                      {row.status === "same" && <span style={muted}>no action</span>}
                      {row.status === "extra" && (
                        <span style={{ ...muted, fontStyle: "italic" }}>no action</span>
                      )}
                      {row.status === "missing" &&
                        (row.ref.isSecret ? (
                          <span style={{ fontSize: 11, color: "#b45309" }}>
                            add by hand
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: "#15803d", fontWeight: 500 }}>
                            will be added
                          </span>
                        ))}
                      {row.status === "changed" &&
                        (row.ref.isSecret ? (
                          <span style={{ fontSize: 11, color: "#b45309" }}>
                            update by hand
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                setRefPicks((prev) => ({ ...prev, [row.key]: undefined }))
                              }
                              style={btnStyle(!picked, "#1d4ed8")}
                            >
                              keep target
                            </button>
                            <button
                              onClick={() =>
                                setRefPicks((prev) => ({ ...prev, [row.key]: "ref" }))
                              }
                              style={btnStyle(picked, "#15803d")}
                            >
                              use reference
                            </button>
                          </>
                        ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <div style={sLabel}>4. Update command for the target</div>
          {!target.name ? (
            <Placeholder>Fill in the target name above</Placeholder>
          ) : pairs.length ? (
            <CmdBox cmd={setEnvCmd(target, pairs)} />
          ) : (
            <Placeholder>
              Nothing to apply. Missing vars are added automatically, changed vars
              only when you pick "use reference".
            </Placeholder>
          )}
          {manual.length > 0 && (
            <div style={{ fontSize: 11, color: "#b45309", marginTop: 8 }}>
              Set by hand (value comes from a Secret, ConfigMap or field):{" "}
              <code>{manual.join(", ")}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
