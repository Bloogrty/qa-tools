import { useState } from "react";
import { parseJSON, diffJSON, buildLineDiff } from "../../utils/jsonDiff";
import { JSON_DIFF_DEFAULT_STATE } from "../../constants/defaultStates";

const DIFF_META = {
  value_mismatch: {
    label: "Value Mismatch",
    color: "#d97706",
    bg: "#fef3c7",
    border: "#fcd34d",
  },
  type_mismatch: {
    label: "Type Mismatch",
    color: "#7c3aed",
    bg: "#ede9fe",
    border: "#c4b5fd",
  },
  missing_left: {
    label: "Missing in Left",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#86efac",
  },
  missing_right: {
    label: "Missing in Right",
    color: "#dc2626",
    bg: "#fee2e2",
    border: "#fca5a5",
  },
  array_length: {
    label: "Array Length",
    color: "#d97706",
    bg: "#fef3c7",
    border: "#fcd34d",
  },
};

const s = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    borderBottom: "1px solid #eee",
    background: "#fff",
    gap: 12,
    flexWrap: "wrap",
    flexShrink: 0,
  },
  toolbarLeft: { display: "flex", alignItems: "baseline", gap: 10 },
  toolbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  title: { fontSize: 16, fontWeight: 600, color: "#1a1a1a" },
  subtitle: { fontSize: 11, color: "#bbb" },
  inputRow: {
    display: "flex",
    gap: 0,
    padding: "16px 20px",
    background: "#fff",
    borderBottom: "1px solid #eee",
    flexShrink: 0,
  },
  inputPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#bbb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputDivider: {
    width: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "#ccc",
    paddingTop: 22,
    flexShrink: 0,
  },
  textarea: {
    width: "100%",
    height: 200,
    padding: "10px 12px",
    border: "1px solid #e5e5e5",
    borderRadius: 6,
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 1.6,
    resize: "vertical",
    outline: "none",
    color: "#1a1a1a",
    background: "#fafafa",
  },
  textareaError: { borderColor: "#dc2626" },
  errorMsg: {
    fontSize: 11,
    color: "#dc2626",
    maxWidth: "60%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  results: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  btnPrimary: {
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 500,
    background: "#1a1a1a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  btnDefault: {
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 500,
    background: "#fff",
    color: "#555",
    border: "1px solid #e5e5e5",
    borderRadius: 6,
    cursor: "pointer",
  },
  noIssues: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "20px 24px",
    background: "#dcfce7",
    border: "1px solid #86efac",
    borderRadius: 8,
    color: "#16a34a",
    fontSize: 14,
    fontWeight: 600,
  },
  tabBar: {
    display: "flex",
    gap: 4,
    background: "#f5f5f5",
    padding: 4,
    borderRadius: 8,
  },
  filterBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  filterLabel: { fontSize: 11, color: "#999" },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    background: "#f5f5f5",
    borderRadius: 6,
    cursor: "pointer",
    border: "1px solid #eee",
    userSelect: "none",
  },
  diffList: { display: "flex", flexDirection: "column", gap: 6, marginTop: 6 },
  diffPath: {
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: 600,
    color: "#1a1a1a",
    background: "#f5f5f5",
    padding: "2px 8px",
    borderRadius: 4,
    border: "1px solid #e5e5e5",
  },
  diffValues: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 6,
  },
  diffSide: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.08em",
    padding: "2px 5px",
    borderRadius: 3,
    background: "rgba(0,0,0,0.06)",
    color: "#999",
  },
  diffArrow: { fontSize: 14, color: "#ccc" },
};

function Toggle({ label, checked, onChange }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <span style={{ fontSize: 12, color: "#555" }}>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 32,
          height: 18,
          borderRadius: 999,
          background: checked ? "#1a1a1a" : "#e5e5e5",
          position: "relative",
          cursor: "pointer",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 14 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </div>
    </label>
  );
}

function Badge({ meta, count, active, onClick }) {
  const isActive = active !== false;
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        cursor: onClick ? "pointer" : "default",
        background: isActive ? meta.bg : "#f5f5f5",
        color: isActive ? meta.color : "#bbb",
        border: `1px solid ${isActive ? meta.border : "#e5e5e5"}`,
        transition: "all 0.15s",
      }}
    >
      {meta.label}
      {count !== undefined ? (
        <span style={{ opacity: 0.7 }}>({count})</span>
      ) : (
        ""
      )}
    </button>
  );
}

function TypeHint({ type, color }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color,
        background: "#f5f5f5",
        padding: "1px 6px",
        borderRadius: 3,
        border: `1px solid ${color}33`,
      }}
    >
      {type}
    </span>
  );
}

function formatValue(val) {
  if (val === undefined) return <em style={{ color: "#bbb" }}>undefined</em>;
  if (val === null) return <em style={{ color: "#bbb" }}>null</em>;
  if (typeof val === "object")
    return (
      <em style={{ color: "#bbb" }}>
        {Array.isArray(val) ? `[array(${val.length})]` : "{object}"}
      </em>
    );
  return (
    <code style={{ fontFamily: "monospace", fontSize: 11 }}>{String(val)}</code>
  );
}

function DiffItem({ diff }) {
  const meta = DIFF_META[diff.type];
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        border: `1px solid ${meta.border}`,
        background: meta.bg,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Badge meta={meta} />
        <code style={s.diffPath}>{diff.path}</code>
      </div>
      <div style={s.diffValues}>
        {diff.type === "array_length" ? (
          <>
            <span style={s.diffSide}>LEFT</span>
            <span style={{ fontSize: 12 }}>{diff.leftValue} items</span>
            <span style={s.diffArrow}>→</span>
            <span style={s.diffSide}>RIGHT</span>
            <span style={{ fontSize: 12 }}>{diff.rightValue} items</span>
          </>
        ) : diff.type === "missing_left" ? (
          <>
            <span style={{ ...s.diffSide, color: "#16a34a" }}>RIGHT ONLY</span>
            <span style={{ fontSize: 12 }}>{formatValue(diff.rightValue)}</span>
            <TypeHint type={diff.rightType} color={meta.color} />
          </>
        ) : diff.type === "missing_right" ? (
          <>
            <span style={{ ...s.diffSide, color: "#dc2626" }}>LEFT ONLY</span>
            <span style={{ fontSize: 12 }}>{formatValue(diff.leftValue)}</span>
            <TypeHint type={diff.leftType} color={meta.color} />
          </>
        ) : (
          <>
            <span style={{ ...s.diffSide, color: "#dc2626" }}>LEFT</span>
            <span style={{ fontSize: 12 }}>{formatValue(diff.leftValue)}</span>
            {diff.type === "type_mismatch" && (
              <TypeHint type={diff.leftType} color={meta.color} />
            )}
            <span style={s.diffArrow}>→</span>
            <span style={{ ...s.diffSide, color: "#16a34a" }}>RIGHT</span>
            <span style={{ fontSize: 12 }}>{formatValue(diff.rightValue)}</span>
            {diff.type === "type_mismatch" && (
              <TypeHint type={diff.rightType} color={meta.color} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DashboardView({ diffs }) {
  const counts = diffs.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {});
  const presentTypes = new Set(Object.keys(counts));

  const [activeFilters, setActiveFilters] = useState(
    new Set([...presentTypes].filter((t) => t !== "array_length")),
  );
  const [collapsed, setCollapsed] = useState({});

  const toggleFilter = (type) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filtered = diffs.filter((d) => activeFilters.has(d.type));

  const groups = {};
  filtered.forEach((diff) => {
    const top = diff.path.split("/")[0].replace(/\[.*/, "") || "(root)";
    if (!groups[top]) groups[top] = [];
    groups[top].push(diff);
  });

  const toggleCollapse = (key) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={s.filterBar}>
        <span style={s.filterLabel}>Show:</span>
        {Object.entries(DIFF_META).map(([type, meta]) =>
          counts[type] ? (
            <Badge
              key={type}
              meta={meta}
              count={counts[type]}
              active={activeFilters.has(type)}
              onClick={() => toggleFilter(type)}
            />
          ) : null,
        )}
        {activeFilters.size === 0 && (
          <button
            onClick={() => setActiveFilters(presentTypes)}
            style={{ ...s.btnDefault, fontSize: 11, padding: "3px 10px" }}
          >
            Show all
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 16, color: "#999", fontSize: 13 }}>
          No results for selected filters.
        </div>
      ) : (
        Object.entries(groups).map(([groupKey, groupDiffs]) => (
          <div key={groupKey}>
            <div
              style={s.sectionHeader}
              onClick={() => toggleCollapse(groupKey)}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>
                {collapsed[groupKey] ? "▶" : "▼"} {groupKey}
              </span>
              <span style={{ fontSize: 11, color: "#999" }}>
                {groupDiffs.length} issue{groupDiffs.length !== 1 ? "s" : ""}
              </span>
            </div>
            {!collapsed[groupKey] && (
              <div style={s.diffList}>
                {groupDiffs.map((diff, i) => (
                  <DiffItem key={i} diff={diff} />
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function SideBySideView({ leftObj, rightObj, sortKeysOn }) {
  const lines = buildLineDiff(leftObj, rightObj, sortKeysOn);
  const [showLabels, setShowLabels] = useState(false);
  let leftNum = 0,
    rightNum = 0;

  const lineNumStyle = {
    width: 32,
    textAlign: "right",
    paddingRight: 10,
    color: "#ccc",
    fontSize: 11,
    fontFamily: "monospace",
    flexShrink: 0,
    userSelect: "none",
  };
  const lineCodeStyle = (color) => ({
    flex: 1,
    fontFamily: "monospace",
    fontSize: 12,
    whiteSpace: "pre",
    overflow: "hidden",
    textOverflow: "ellipsis",
    padding: "0 8px",
    color,
  });

  const lineBg = {
    same: "transparent",
    added: "#f0fdf4",
    removed: "#fff5f5",
    changed: "#fffbeb",
    type_changed: "#f5f3ff",
  };
  const lineColors = {
    removed: "#dc2626",
    added: "#16a34a",
    changed: "#92400e",
    type_changed: "#7c3aed",
    same: "#1a1a1a",
  };
  const prefix = {
    removed: "− ",
    added: "+ ",
    changed: "~ ",
    type_changed: "! ",
    same: "  ",
  };
  const lineLabel = { changed: "value changed", type_changed: "type mismatch" };
  const labelStyle = (type) => ({
    fontSize: 10,
    fontWeight: 600,
    padding: "1px 6px",
    borderRadius: 3,
    marginLeft: 8,
    flexShrink: 0,
    color: lineColors[type],
    background: lineBg[type],
    border: `1px solid ${type === "type_changed" ? "#c4b5fd" : "#fcd34d"}`,
  });

  const legend = [
    { color: "#dc2626", bg: "#fff5f5", symbol: "−", label: "Only in Left" },
    { color: "#16a34a", bg: "#f0fdf4", symbol: "+", label: "Only in Right" },
    { color: "#7c3aed", bg: "#f5f3ff", symbol: "!", label: "Type mismatch" },
    { color: "#92400e", bg: "#fffbeb", symbol: "~", label: "Value changed" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "#f9f9f9",
          border: "1px solid #eee",
          borderRadius: 8,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>
            LEGEND
          </span>
          {legend.map((l) => (
            <span
              key={l.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: l.bg,
                  color: l.color,
                }}
              >
                {l.symbol}
              </span>
              <span style={{ color: "#555" }}>{l.label}</span>
            </span>
          ))}
        </div>
        <Toggle
          label="Show labels"
          checked={showLabels}
          onChange={setShowLabels}
        />
      </div>

      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid #eee",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#dc2626",
              background: "#fff5f5",
              borderRight: "1px solid #eee",
            }}
          >
            LEFT
          </div>
          <div
            style={{
              padding: "8px 12px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#16a34a",
              background: "#f0fdf4",
            }}
          >
            RIGHT
          </div>
        </div>
        <div style={{ overflowX: "auto", background: "#fafafa" }}>
          {lines.map((line, i) => {
            if (line.type !== "added") leftNum++;
            if (line.type !== "removed") rightNum++;
            const lNum = line.type !== "added" ? leftNum : null;
            const rNum = line.type !== "removed" ? rightNum : null;
            const isChanged =
              line.type === "changed" || line.type === "type_changed";
            const color =
              line.type === "same"
                ? lineColors.same
                : lineColors[line.type] || "#1a1a1a";
            const tag = showLabels && lineLabel[line.type];
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background:
                      line.type === "removed" || isChanged
                        ? lineBg[line.type]
                        : "transparent",
                    padding: "1px 0",
                    borderRight: "1px solid #eee",
                    minWidth: 0,
                  }}
                >
                  <span style={lineNumStyle}>{lNum ?? ""}</span>
                  <span style={lineCodeStyle(color)}>
                    {prefix[line.type] || "  "}
                    {line.left ?? ""}
                  </span>
                  {tag && <span style={labelStyle(line.type)}>{tag}</span>}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background:
                      line.type === "added" || isChanged
                        ? lineBg[line.type]
                        : "transparent",
                    padding: "1px 0",
                    minWidth: 0,
                  }}
                >
                  <span style={lineNumStyle}>{rNum ?? ""}</span>
                  <span style={lineCodeStyle(color)}>
                    {prefix[line.type] || "  "}
                    {line.right ?? ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const EXAMPLE_LEFT = `{
  "order_id": "ORD-20260511-001",
  "status": "confirmed",
  "customer": {
    "id": 1021,
    "name": "Alice",
    "email": "alice@email.com"
  },
  "items": [
    { "product_id": "P001", "name": "Wireless Mouse", "qty": 1, "price": 150000 },
    { "product_id": "P002", "name": "Keyboard", "qty": 1, "price": 350000 }
  ],
  "payment": {
    "method": "credit_card",
    "total": 500000,
    "paid": true
  }
}`;

const EXAMPLE_RIGHT = `{
  "order_id": "ORD-20260511-001",
  "status": "processing",
  "customer": {
    "id": "1021",
    "name": "Alice",
    "email": "alice@email.com"
  },
  "items": [
    { "product_id": "P001", "name": "Wireless Mouse", "qty": 2, "price": 150000 },
    { "product_id": "P002", "name": "Keyboard", "qty": 1, "price": 350000 },
    { "product_id": "P003", "name": "Mouse Pad", "qty": 1, "price": 50000 }
  ],
  "payment": {
    "method": "credit_card",
    "total": 700000,
    "paid": false
  },
  "note": "gift wrap requested"
}`;

export default function JsonDiffPage({ state, setState }) {
  const st = state || JSON_DIFF_DEFAULT_STATE;
  const {
    leftRaw,
    rightRaw,
    sortKeysOn,
    diffs,
    parsedLeft,
    parsedRight,
    errors,
    ran,
    activeTab,
  } = st;
  const update = (patch) =>
    setState((prev) => ({ ...(prev || JSON_DIFF_DEFAULT_STATE), ...patch }));
  const setLeftRaw = (v) => update({ leftRaw: v });
  const setRightRaw = (v) => update({ rightRaw: v });
  const setSortKeysOn = (v) => update({ sortKeysOn: v });
  const setActiveTab = (v) => update({ activeTab: v });

  const handleCompare = () => {
    const errs = { left: null, right: null };
    let lp, rp;
    try {
      lp = parseJSON(leftRaw);
    } catch (e) {
      errs.left = e.message;
    }
    try {
      rp = parseJSON(rightRaw);
    } catch (e) {
      errs.right = e.message;
    }
    if (errs.left || errs.right) {
      update({ errors: errs });
      return;
    }
    update({
      errors: errs,
      diffs: diffJSON(lp, rp, sortKeysOn),
      parsedLeft: lp,
      parsedRight: rp,
      ran: true,
    });
  };

  const handleClear = () => {
    update({
      leftRaw: "",
      rightRaw: "",
      diffs: null,
      parsedLeft: null,
      parsedRight: null,
      errors: { left: null, right: null },
      ran: false,
    });
  };
  const handleExample = () => {
    update({
      leftRaw: EXAMPLE_LEFT,
      rightRaw: EXAMPLE_RIGHT,
      diffs: null,
      ran: false,
    });
  };

  const tabBtn = (key, label) => (
    <button
      key={key}
      onClick={() => setActiveTab(key)}
      style={{
        padding: "5px 14px",
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        background: activeTab === key ? "#fff" : "transparent",
        color: activeTab === key ? "#1a1a1a" : "#888",
        boxShadow: activeTab === key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={s.wrap}>
      <div style={s.toolbar}>
        <div style={s.toolbarLeft}>
          <span style={s.title}>JSON Diff</span>
          <span style={s.subtitle}>Semantic JSON comparison</span>
        </div>
        <div style={s.toolbarRight}>
          <Toggle
            label="Sort keys"
            checked={sortKeysOn}
            onChange={setSortKeysOn}
          />
          <button style={s.btnDefault} onClick={handleExample}>
            Load example
          </button>
          <button style={s.btnDefault} onClick={handleClear}>
            Clear
          </button>
          <button
            style={s.btnPrimary}
            onClick={handleCompare}
            disabled={!leftRaw.trim() || !rightRaw.trim()}
          >
            ⚖ Compare
          </button>
        </div>
      </div>

      <div style={s.inputRow}>
        <div style={s.inputPanel}>
          <div style={s.inputLabel}>
            <span>LEFT JSON</span>
            {errors.left && <span style={s.errorMsg}>{errors.left}</span>}
          </div>
          <textarea
            style={{ ...s.textarea, ...(errors.left ? s.textareaError : {}) }}
            value={leftRaw}
            onChange={(e) => setLeftRaw(e.target.value)}
            placeholder='{ "key": "value" }'
            spellCheck={false}
          />
        </div>
        <div style={s.inputDivider}>⟺</div>
        <div style={s.inputPanel}>
          <div style={s.inputLabel}>
            <span>RIGHT JSON</span>
            {errors.right && <span style={s.errorMsg}>{errors.right}</span>}
          </div>
          <textarea
            style={{ ...s.textarea, ...(errors.right ? s.textareaError : {}) }}
            value={rightRaw}
            onChange={(e) => setRightRaw(e.target.value)}
            placeholder='{ "key": "value" }'
            spellCheck={false}
          />
        </div>
      </div>

      {ran && (
        <div style={s.results}>
          {diffs.length === 0 ? (
            <div style={s.noIssues}>
              ✓ No differences found, JSONs are identical
            </div>
          ) : (
            <>
              <div style={s.tabBar}>
                {tabBtn("sidebyside", "Side by Side")}
                {tabBtn("details", `Details (${diffs.length})`)}
              </div>
              {activeTab === "details" && <DashboardView diffs={diffs} />}
              {activeTab === "sidebyside" && (
                <SideBySideView
                  leftObj={parsedLeft}
                  rightObj={parsedRight}
                  sortKeysOn={sortKeysOn}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
