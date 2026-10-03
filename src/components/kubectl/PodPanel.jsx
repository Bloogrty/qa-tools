import { useState } from "react";
import CmdBox from "../common/CmdBox";
import { useSettings } from "../../hooks/useSettings";
import { guessDeployName } from "../../utils/pods";
import { shq } from "../../utils/shell";
import { normalize } from "../../utils/strings";

const sLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 6,
};

const smallBtn = {
  fontSize: 11,
  padding: "2px 8px",
  cursor: "pointer",
  border: "1px solid #e0e0e0",
  borderRadius: 4,
  background: "#fff",
};

export default function PodPanel({ pod, ns, cli = "kubectl" }) {
  const settings = useSettings();

  const [deploy, setDeploy] = useState(guessDeployName(pod.name));
  const [editingDeploy, setEditingDeploy] = useState(false);
  const [deployInput, setDeployInput] = useState(deploy);

  const [envRaw, setEnvRaw] = useState("");
  const [envPairs, setEnvPairs] = useState([]);
  const [envEdited, setEnvEdited] = useState({});
  const [envSearch, setEnvSearch] = useState("");

  const confirmDeploy = () => {
    setDeploy(deployInput.trim() || deploy);
    setEditingDeploy(false);
  };

  const parseEnv = () => {
    const pairs = envRaw
      .trim()
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => {
        const idx = l.indexOf("=");
        return { k: l.slice(0, idx).trim(), v: l.slice(idx + 1).trim() };
      });
    setEnvPairs(pairs);
    setEnvEdited({});
    setEnvSearch("");
  };

  const filteredEnv = envPairs.filter((p) =>
    normalize(p.k).includes(normalize(envSearch)),
  );

  const changedPairs = envPairs.filter(
    (p) => envEdited[p.k] !== undefined && envEdited[p.k] !== p.v,
  );

  const overwriteCmd = changedPairs.length
    ? `${cli} set env deploy ${deploy} --overwrite ${changedPairs
        .map((c) => `${c.k}=${shq(envEdited[c.k])}`)
        .join(" ")} -n ${ns}`
    : null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: 10,
        padding: 16,
        position: "sticky",
        top: 0,
        maxHeight: "95vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 13,
          wordBreak: "break-all",
          marginBottom: 6,
        }}
      >
        {pod.name}
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}
      >
        <span style={{ fontSize: 11, color: "#888" }}>deploy:</span>
        {editingDeploy ? (
          <>
            <input
              value={deployInput}
              onChange={(e) => setDeployInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmDeploy()}
              autoFocus
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                padding: "2px 6px",
                border: "1px solid #bbb",
                borderRadius: 4,
                flex: 1,
              }}
            />
            <button
              onClick={confirmDeploy}
              style={{ ...smallBtn, background: "#1a1a1a", color: "#fff" }}
            >
              ok
            </button>
            <button onClick={() => setEditingDeploy(false)} style={smallBtn}>
              cancel
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 11, fontFamily: "monospace", color: "#444" }}>
              {deploy}
            </span>
            <button
              onClick={() => {
                setDeployInput(deploy);
                setEditingDeploy(true);
              }}
              style={{ ...smallBtn, fontSize: 10, padding: "1px 7px", color: "#888" }}
            >
              edit
            </button>
          </>
        )}
      </div>

      {settings.showLogs && (
        <div style={{ marginBottom: 14 }}>
          <div style={sLabel}>Logs</div>
          <CmdBox cmd={`${cli} logs -f ${pod.name} -n ${ns}`} />
          <CmdBox cmd={`${cli} logs -f ${pod.name} -n ${ns} --tail=200`} />
        </div>
      )}

      {settings.showScale && (
        <div style={{ marginBottom: 14 }}>
          <div style={sLabel}>Scale</div>
          <CmdBox cmd={`${cli} -n ${ns} scale deploy ${deploy} --replicas=1`} />
          <CmdBox cmd={`${cli} -n ${ns} scale deploy ${deploy} --replicas=0`} />
        </div>
      )}

      {settings.showDelete && (
        <div style={{ marginBottom: 14 }}>
          <div style={sLabel}>Delete pod</div>
          <CmdBox cmd={`${cli} delete pod ${pod.name} -n ${ns}`} />
        </div>
      )}

      {settings.showExec && (
        <div style={{ marginBottom: 14 }}>
          <div style={sLabel}>Exec</div>
          <CmdBox cmd={`${cli} exec -it ${pod.name} -n ${ns} -- sh`} />
          <CmdBox
            cmd={`${cli} exec -it ${pod.name} -n ${ns} -- sh -c 'env | sort'`}
          />
        </div>
      )}

      {settings.showDeployment && (
        <div style={{ marginBottom: 14 }}>
          <div style={sLabel}>Deployment</div>
          <CmdBox cmd={`${cli} get deployment ${deploy} -n ${ns} -o yaml`} />
          <CmdBox cmd={`${cli} edit deployment ${deploy} -n ${ns}`} />
        </div>
      )}

      {settings.showEnvVars && (
        <>
          <hr
            style={{ border: "none", borderTop: "1px solid #eee", margin: "14px 0" }}
          />
          <div>
            <div style={sLabel}>Env vars</div>
            <CmdBox cmd={`${cli} set env deploy ${deploy} --list -n ${ns}`} />

            <textarea
              value={envRaw}
              onChange={(e) => setEnvRaw(e.target.value)}
              placeholder="Paste KEY=VALUE lines from the --list output..."
              style={{
                width: "100%",
                minHeight: 70,
                fontSize: 11,
                fontFamily: "monospace",
                padding: 8,
                border: "1px solid #e0e0e0",
                borderRadius: 6,
                resize: "vertical",
                marginTop: 8,
              }}
            />
            <button
              onClick={parseEnv}
              style={{
                marginTop: 6,
                padding: "5px 12px",
                fontSize: 12,
                cursor: "pointer",
                border: "1px solid #e0e0e0",
                borderRadius: 6,
                background: "#fff",
              }}
            >
              Parse &amp; edit
            </button>

            {envPairs.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  <input
                    value={envSearch}
                    onChange={(e) => setEnvSearch(e.target.value)}
                    placeholder="Filter env vars..."
                    style={{
                      flex: 1,
                      padding: "5px 8px",
                      fontSize: 12,
                      border: "1px solid #e0e0e0",
                      borderRadius: 6,
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>
                    {filteredEnv.length}/{envPairs.length}
                  </span>
                </div>

                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {filteredEnv.map((p) => {
                    const edited =
                      envEdited[p.k] !== undefined && envEdited[p.k] !== p.v;
                    return (
                      <div
                        key={p.k}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 6,
                          marginBottom: 5,
                          alignItems: "center",
                        }}
                      >
                        <div
                          title={p.k}
                          style={{
                            fontSize: 11,
                            fontFamily: "monospace",
                            color: "#666",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.k}
                        </div>
                        <input
                          value={envEdited[p.k] !== undefined ? envEdited[p.k] : p.v}
                          onChange={(e) =>
                            setEnvEdited((prev) => ({ ...prev, [p.k]: e.target.value }))
                          }
                          style={{
                            fontSize: 11,
                            fontFamily: "monospace",
                            padding: "3px 6px",
                            border: "1px solid #e0e0e0",
                            borderRadius: 4,
                            background: edited ? "#fffbeb" : "#fff",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {overwriteCmd && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ ...sLabel, color: "#b45309" }}>
                      {changedPairs.length} change
                      {changedPairs.length > 1 ? "s" : ""} | click to copy
                    </div>
                    <CmdBox cmd={overwriteCmd} />
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
