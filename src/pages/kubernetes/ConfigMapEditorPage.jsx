import { useState, useMemo } from "react";
import CmdBox from "../../components/common/CmdBox";
import PageHeader from "../../components/common/PageHeader";
import Placeholder from "../../components/common/Placeholder";
import ToggleGroup from "../../components/common/ToggleGroup";
import { useWorkspace } from "../../hooks/useWorkspace";
import { pick } from "../../utils/workspace";
import {
  buildConfigMap,
  validateJson,
  prettyJson,
  parseConfigMap,
  dumpConfigMap,
} from "../../utils/configMap";

const sLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 6,
};

const field = {
  width: "100%",
  padding: "7px 10px",
  fontSize: 12,
  border: "1px solid #e0e0e0",
  borderRadius: 6,
};

const area = {
  width: "100%",
  minHeight: 180,
  fontSize: 12,
  fontFamily: "monospace",
  padding: 10,
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  resize: "vertical",
};

const prettyBtn = (enabled) => ({
  padding: "6px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: enabled ? "pointer" : "default",
  border: "none",
  borderRadius: 6,
  background: enabled ? "#1d4ed8" : "#e5e5e5",
  color: enabled ? "#fff" : "#aaa",
});

export default function ConfigMapEditorPage() {
  const { namespaces } = useWorkspace();
  const [mode, setMode] = useState("add");

  const [name, setName] = useState("");
  const [nsChoice, setNsChoice] = useState("");
  const [dataKey, setDataKey] = useState("");
  const [jsonText, setJsonText] = useState("");
  const namespace = pick(nsChoice, namespaces);

  const [rawYaml, setRawYaml] = useState("");
  const [editErr, setEditErr] = useState("");
  const [editDoc, setEditDoc] = useState(null);
  const [editData, setEditData] = useState({});

  const jsonErr = useMemo(() => validateJson(jsonText), [jsonText]);

  const addYaml = useMemo(() => {
    if (!name.trim() || !dataKey.trim() || !jsonText.trim()) return "";
    return buildConfigMap({
      name: name.trim(),
      namespace,
      dataKey: dataKey.trim(),
      jsonText,
    });
  }, [name, namespace, dataKey, jsonText]);

  function parseYaml() {
    try {
      const { doc, data } = parseConfigMap(rawYaml);
      const pretty = {};
      for (const [k, v] of Object.entries(data)) {
        pretty[k] = typeof v === "string" ? prettyJson(v) : v;
      }
      setEditDoc(doc);
      setEditData(pretty);
      setEditErr("");
    } catch (e) {
      setEditDoc(null);
      setEditData({});
      setEditErr(e.message);
    }
  }

  const editYaml = useMemo(
    () => (editDoc ? dumpConfigMap(editDoc, editData) : ""),
    [editDoc, editData],
  );

  function clearAll() {
    if (mode === "add") {
      setName("");
      setDataKey("");
      setJsonText("");
    } else {
      setRawYaml("");
      setEditDoc(null);
      setEditData({});
      setEditErr("");
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <PageHeader
        title="ConfigMap Editor"
        subtitle="Turn plain JSON into a ConfigMap manifest, or edit the JSON inside an existing one"
      />

      <div style={{ display: "flex", gap: 6, marginBottom: 16, alignItems: "center" }}>
        <ToggleGroup
          options={[
            { value: "add", label: "New" },
            { value: "edit", label: "Edit existing" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <button
          onClick={clearAll}
          style={{
            marginLeft: "auto",
            padding: "5px 14px",
            fontSize: 12,
            cursor: "pointer",
            borderRadius: 6,
            border: "1px solid #e0e0e0",
            background: "#fff",
            color: "#555",
          }}
        >
          Clear
        </button>
      </div>

      {mode === "add" && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={sLabel}>Namespace</div>
            <ToggleGroup options={namespaces} value={namespace} onChange={setNsChoice} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div>
              <div style={sLabel}>ConfigMap name</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. app-config"
                style={field}
              />
            </div>
            <div>
              <div style={sLabel}>Data key (file name)</div>
              <input
                value={dataKey}
                onChange={(e) => setDataKey(e.target.value)}
                placeholder="e.g. config.json"
                style={field}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ ...sLabel, marginBottom: 0 }}>JSON content</span>
                {jsonErr && (
                  <span style={{ fontSize: 11, color: "#dc2626" }}>
                    Invalid JSON: {jsonErr}
                  </span>
                )}
              </div>
              <button
                onClick={() => setJsonText(prettyJson(jsonText))}
                disabled={!jsonText.trim() || !!jsonErr}
                style={prettyBtn(!!jsonText.trim() && !jsonErr)}
              >
                Prettify
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={'{\n  "featureFlags": { "newCheckout": true }\n}'}
              spellCheck={false}
              style={area}
            />
          </div>

          <div style={sLabel}>Generated YAML</div>
          {addYaml ? (
            <CmdBox cmd={addYaml} />
          ) : (
            <Placeholder>Fill in name, data key and JSON content</Placeholder>
          )}
        </div>
      )}

      {mode === "edit" && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={sLabel}>Paste ConfigMap YAML</div>
            <textarea
              value={rawYaml}
              onChange={(e) => setRawYaml(e.target.value)}
              placeholder="Paste the output of: kubectl get configmap <name> -n <namespace> -o yaml"
              spellCheck={false}
              style={area}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <button
                onClick={parseYaml}
                disabled={!rawYaml.trim()}
                style={{
                  padding: "7px 16px",
                  fontSize: 13,
                  cursor: rawYaml.trim() ? "pointer" : "default",
                  background: rawYaml.trim() ? "#1a1a1a" : "#e5e5e5",
                  color: rawYaml.trim() ? "#fff" : "#aaa",
                  border: "none",
                  borderRadius: 6,
                }}
              >
                Parse
              </button>
              {editErr && (
                <span style={{ fontSize: 12, color: "#dc2626" }}>{editErr}</span>
              )}
            </div>
          </div>

          {editDoc && (
            <>
              <div
                style={{
                  fontSize: 12,
                  color: "#888",
                  marginBottom: 12,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span>
                  name:{" "}
                  <code style={{ color: "#444" }}>
                    {editDoc.metadata?.name || "(none)"}
                  </code>
                </span>
                <span style={{ color: "#ddd" }}>·</span>
                <span>
                  namespace:{" "}
                  <code style={{ color: "#444" }}>
                    {editDoc.metadata?.namespace || "(none)"}
                  </code>
                </span>
              </div>

              {Object.keys(editData).length === 0 ? (
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 16 }}>
                  This ConfigMap has no data entries.
                </div>
              ) : (
                Object.keys(editData).map((key) => {
                  const valid = !validateJson(editData[key]);
                  return (
                    <div key={key} style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ ...sLabel, marginBottom: 0 }}>{key}</span>
                        <button
                          onClick={() =>
                            setEditData((prev) => ({
                              ...prev,
                              [key]: prettyJson(prev[key]),
                            }))
                          }
                          disabled={!valid}
                          style={prettyBtn(valid)}
                        >
                          Prettify
                        </button>
                      </div>
                      <textarea
                        value={editData[key]}
                        onChange={(e) =>
                          setEditData((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        spellCheck={false}
                        style={area}
                      />
                    </div>
                  );
                })
              )}

              <div style={sLabel}>Generated YAML</div>
              <CmdBox cmd={editYaml} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
