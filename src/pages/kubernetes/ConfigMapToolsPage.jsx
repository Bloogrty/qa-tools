import { useState } from "react";
import CmdBox from "../../components/common/CmdBox";
import PageHeader from "../../components/common/PageHeader";
import Placeholder from "../../components/common/Placeholder";
import ToggleGroup from "../../components/common/ToggleGroup";
import CliToggle from "../../components/kubectl/CliToggle";
import { useWorkspace } from "../../hooks/useWorkspace";
import { pick } from "../../utils/workspace";
import { normalize } from "../../utils/strings";
import {
  listCmd,
  describeCmd,
  yamlCmd,
  editCmd,
  rolloutRestartCmd,
  scaleRestartCmd,
  parseConfigMapList,
  cleanJson,
  toDataScalar,
} from "../../utils/configMap";

const sLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 6,
};

const sectionHeader = {
  fontSize: 14,
  fontWeight: 600,
  color: "#1a1a1a",
  marginBottom: 4,
};

const sectionHint = { fontSize: 12, color: "#888", marginBottom: 14 };

const field = {
  width: "100%",
  padding: "7px 10px",
  fontSize: 12,
  border: "1px solid #e0e0e0",
  borderRadius: 6,
};

const area = {
  width: "100%",
  minHeight: 320,
  fontSize: 12,
  fontFamily: "monospace",
  padding: 10,
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  resize: "vertical",
};

const blueBtn = (enabled) => ({
  padding: "6px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: enabled ? "pointer" : "default",
  border: "none",
  borderRadius: 6,
  background: enabled ? "#1d4ed8" : "#e5e5e5",
  color: enabled ? "#fff" : "#aaa",
});

const divider = { borderTop: "1px solid #eee", margin: "24px 0" };

export default function ConfigMapToolsPage() {
  const { namespaces, clis } = useWorkspace();
  const [nsChoice, setNsChoice] = useState("");
  const [cliChoice, setCliChoice] = useState("");
  const ns = pick(nsChoice, namespaces);
  const cli = pick(cliChoice, clis);

  const [rawList, setRawList] = useState("");
  const [names, setNames] = useState([]);
  const [listSearch, setListSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [manual, setManual] = useState("");
  const cmName = manual.trim() || selected;

  const [rawInput, setRawInput] = useState("");
  const [cleanText, setCleanText] = useState("");
  const [cleanCopied, setCleanCopied] = useState(false);

  const [deploy, setDeploy] = useState("");

  const copyClean = () => {
    navigator.clipboard?.writeText(cleanText);
    setCleanCopied(true);
    setTimeout(() => setCleanCopied(false), 1500);
  };

  const filteredNames = names.filter((n) =>
    normalize(n).includes(normalize(listSearch)),
  );

  return (
    <div style={{ padding: 16 }}>
      <PageHeader
        title="ConfigMap Tools"
        subtitle="Find and edit a ConfigMap, clean or escape its JSON value, then restart the pods that read it"
      />

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <ToggleGroup
          label="Namespace"
          options={namespaces}
          value={ns}
          onChange={setNsChoice}
        />
        <CliToggle value={cli} onChange={setCliChoice} />
      </div>

      <div>
        <div style={sectionHeader}>Commands</div>
        <div style={sectionHint}>
          List ConfigMaps, pick one, and copy the read or edit command. Optional,
          you can go straight to the JSON tool below.
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={sLabel}>List configmaps</div>
          <CmdBox cmd={listCmd(cli, ns)} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={sLabel}>Paste the list output (optional)</div>
          <textarea
            value={rawList}
            onChange={(e) => setRawList(e.target.value)}
            placeholder="Paste the get configmap output here..."
            style={{ ...area, minHeight: 110 }}
          />
          <button
            onClick={() => setNames(parseConfigMapList(rawList))}
            disabled={!rawList.trim()}
            style={{
              marginTop: 8,
              padding: "7px 16px",
              fontSize: 13,
              cursor: rawList.trim() ? "pointer" : "default",
              background: rawList.trim() ? "#1a1a1a" : "#e5e5e5",
              color: rawList.trim() ? "#fff" : "#aaa",
              border: "none",
              borderRadius: 6,
            }}
          >
            Parse
          </button>

          {names.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <input
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Search configmaps..."
                  style={field}
                />
                <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>
                  {filteredNames.length}/{names.length}
                </span>
              </div>
              <div
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  maxHeight: 220,
                  overflowY: "auto",
                }}
              >
                {filteredNames.length === 0 ? (
                  <div
                    style={{ textAlign: "center", padding: 16, fontSize: 12, color: "#aaa" }}
                  >
                    No match
                  </div>
                ) : (
                  filteredNames.map((n) => {
                    const active = selected === n && !manual;
                    return (
                      <div
                        key={n}
                        onClick={() => {
                          setSelected(n);
                          setManual("");
                        }}
                        style={{
                          padding: "7px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #f0f0f0",
                          fontFamily: "monospace",
                          fontSize: 12,
                          background: active ? "#f0f9ff" : "transparent",
                          color: active ? "#1d4ed8" : "#333",
                        }}
                      >
                        {n}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={sLabel}>ConfigMap name</div>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder={selected || "e.g. app-config"}
            style={field}
          />
        </div>

        <div style={sLabel}>Commands</div>
        {cmName ? (
          <>
            <CmdBox label="Read" cmd={describeCmd(cli, ns, cmName)} />
            <CmdBox label="Read as YAML" cmd={yamlCmd(cli, ns, cmName)} />
            <CmdBox label="Edit" cmd={editCmd(cli, ns, cmName)} />
          </>
        ) : (
          <Placeholder>Pick a configmap from the list, or type a name</Placeholder>
        )}
      </div>

      <div style={divider} />

      <div>
        <div style={sectionHeader}>JSON clean + escape</div>
        <div style={sectionHint}>
          Paste a JSON config value, clean it into readable JSON, edit it, then
          copy the escaped value for the ConfigMap data field.
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
            <span style={{ ...sLabel, marginBottom: 0 }}>Paste config JSON</span>
            <button
              onClick={() => setCleanText(cleanJson(rawInput))}
              disabled={!rawInput.trim()}
              style={blueBtn(!!rawInput.trim())}
            >
              Clean
            </button>
          </div>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Paste raw or escaped JSON here, then click Clean"
            spellCheck={false}
            style={{ ...area, minHeight: 140 }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ ...sLabel, marginBottom: 0 }}>Edit JSON</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={copyClean}
                  disabled={!cleanText.trim()}
                  style={{
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: cleanText.trim() ? "pointer" : "default",
                    border: `1px solid ${cleanCopied ? "#86efac" : "#e0e0e0"}`,
                    borderRadius: 6,
                    background: cleanCopied ? "#dcfce7" : "#fff",
                    color: !cleanText.trim()
                      ? "#bbb"
                      : cleanCopied
                        ? "#16a34a"
                        : "#555",
                  }}
                >
                  {cleanCopied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => setCleanText(cleanJson(cleanText))}
                  disabled={!cleanText.trim()}
                  style={blueBtn(!!cleanText.trim())}
                >
                  Prettify
                </button>
              </div>
            </div>
            <textarea
              value={cleanText}
              onChange={(e) => setCleanText(e.target.value)}
              placeholder="Cleaned JSON shows here. Edit it, then copy the escaped value."
              spellCheck={false}
              style={area}
            />
          </div>

          <div>
            <div style={sLabel}>Escaped value</div>
            {cleanText.trim() ? (
              <CmdBox label="Paste into the data: field" cmd={toDataScalar(cleanText)} />
            ) : (
              <Placeholder>Clean or paste JSON on the left</Placeholder>
            )}
          </div>
        </div>
      </div>

      <div style={divider} />

      <div>
        <div style={sectionHeader}>Restart pods</div>
        <div style={sectionHint}>
          Pods read a ConfigMap when they start, so restart the deployment after
          an edit.
        </div>
        <div style={{ marginBottom: 12, maxWidth: 360 }}>
          <div style={sLabel}>Deployment name</div>
          <input
            value={deploy}
            onChange={(e) => setDeploy(e.target.value)}
            placeholder="e.g. orders-api"
            style={field}
          />
        </div>
        {deploy.trim() ? (
          <>
            <CmdBox label="Rolling restart" cmd={rolloutRestartCmd(cli, ns, deploy.trim())} />
            <CmdBox
              label="Scale down and back up (brief downtime)"
              cmd={scaleRestartCmd(cli, ns, deploy.trim())}
            />
          </>
        ) : (
          <Placeholder>Type the deployment name</Placeholder>
        )}
      </div>
    </div>
  );
}
