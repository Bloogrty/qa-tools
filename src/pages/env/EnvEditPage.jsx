import { useState, useMemo } from "react";
import CmdBox from "../../components/common/CmdBox";
import PageHeader from "../../components/common/PageHeader";
import ResourcePicker from "../../components/env/ResourcePicker";
import { useWorkspace } from "../../hooks/useWorkspace";
import {
  resolveResource,
  listEnvCmd,
  setEnvCmd,
  parseEnvList,
} from "../../utils/envList";

const sLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 6,
};

const smallBtn = {
  padding: "4px 10px",
  fontSize: 11,
  cursor: "pointer",
  borderRadius: 6,
  border: "1px solid #e0e0e0",
  background: "#fff",
  color: "#555",
};

const GRID = "220px 1fr 1fr 32px";

export default function EnvEditPage() {
  const ws = useWorkspace();
  const [resource, setResource] = useState({
    cli: "",
    ns: "",
    type: "deployment",
    name: "",
  });
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("");

  const r = resolveResource(resource, ws);

  function handlePaste(text) {
    setRaw(text);
    setRows(
      parseEnvList(text).map((e) => ({
        key: e.key,
        origValue: e.value,
        newValue: e.value,
        source: e.source,
        isSecret: e.isSecret,
      })),
    );
  }

  const updateRow = (key, newValue) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, newValue } : row)));

  const resetRow = (key) =>
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, newValue: row.origValue } : row)),
    );

  const resetAll = () =>
    setRows((prev) => prev.map((row) => ({ ...row, newValue: row.origValue })));

  const filteredRows = useMemo(
    () => rows.filter((row) => row.key.toLowerCase().includes(filter.toLowerCase())),
    [rows, filter],
  );

  const changedRows = rows.filter((row) => !row.isSecret && row.newValue !== row.origValue);

  const canBuild = r.name && changedRows.length > 0;
  const rollbackCmd = canBuild
    ? setEnvCmd(r, changedRows.map((row) => ({ key: row.key, value: row.origValue })))
    : null;
  const updateCmd = canBuild
    ? setEnvCmd(r, changedRows.map((row) => ({ key: row.key, value: row.newValue })))
    : null;

  return (
    <div style={{ padding: 16 }}>
      <PageHeader
        title="Env Edit"
        subtitle="Edit env vars in a table and get both the update command and a rollback command"
      />

      <div style={{ marginBottom: 16 }}>
        <ResourcePicker value={resource} onChange={setResource} />
      </div>

      {r.name && (
        <div style={{ marginBottom: 16 }}>
          <div style={sLabel}>Get env</div>
          <CmdBox cmd={listEnvCmd(r)} />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={sLabel}>Paste env output</div>
        <textarea
          value={raw}
          onChange={(e) => handlePaste(e.target.value)}
          placeholder="Paste the set env --list output here..."
          style={{
            width: "100%",
            minHeight: 100,
            fontSize: 11,
            fontFamily: "monospace",
            padding: 10,
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            resize: "vertical",
          }}
        />
      </div>

      {rows.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by key..."
              style={{
                flex: 1,
                padding: "6px 10px",
                fontSize: 12,
                border: "1px solid #e0e0e0",
                borderRadius: 6,
              }}
            />
            <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>
              {filteredRows.length}/{rows.length} vars
              {changedRows.length > 0 && (
                <span style={{ color: "#b45309", marginLeft: 8 }}>
                  {changedRows.length} edited
                </span>
              )}
            </span>
            {changedRows.length > 0 && (
              <button onClick={resetAll} style={smallBtn}>
                reset all
              </button>
            )}
          </div>

          <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
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
              <span>Original</span>
              <span>New value</span>
              <span></span>
            </div>

            {filteredRows.map((row) => {
              const changed = !row.isSecret && row.newValue !== row.origValue;
              return (
                <div
                  key={row.key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: GRID,
                    padding: "6px 12px",
                    borderBottom: "1px solid #f0f0f0",
                    background: changed ? "#fffbeb" : "transparent",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      fontWeight: changed ? 600 : 400,
                      color: changed ? "#b45309" : "#333",
                      wordBreak: "break-all",
                    }}
                  >
                    {row.key}
                    {changed && (
                      <span style={{ display: "block", fontSize: 10, color: "#b45309" }}>
                        edited
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: changed ? "#aaa" : "#444",
                      wordBreak: "break-all",
                      textDecoration: changed ? "line-through" : "none",
                    }}
                  >
                    {row.isSecret ? (
                      <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                        {row.source}
                      </span>
                    ) : (
                      row.origValue
                    )}
                  </div>

                  <div>
                    {row.isSecret ? (
                      <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
                        read only
                      </span>
                    ) : (
                      <input
                        value={row.newValue ?? ""}
                        onChange={(e) => updateRow(row.key, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "4px 8px",
                          fontSize: 11,
                          fontFamily: "monospace",
                          border: `1px solid ${changed ? "#fcd34d" : "#e0e0e0"}`,
                          borderRadius: 4,
                          background: changed ? "#fffbeb" : "#fff",
                        }}
                      />
                    )}
                  </div>

                  <div>
                    {changed && (
                      <button
                        onClick={() => resetRow(row.key)}
                        title="Reset to original"
                        style={{ ...smallBtn, fontSize: 13, padding: "2px 6px", borderRadius: 4 }}
                      >
                        ↺
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {changedRows.length > 0 &&
        (canBuild ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={sLabel}>Update command (new values)</div>
              <CmdBox cmd={updateCmd} />
            </div>
            <div>
              <div style={sLabel}>Rollback command (original values)</div>
              <CmdBox cmd={rollbackCmd} />
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#b45309" }}>
            Fill in the resource name above to get the commands.
          </div>
        ))}
    </div>
  );
}
