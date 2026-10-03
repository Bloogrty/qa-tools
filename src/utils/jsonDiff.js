export function parseJSON(raw) {
  if (!raw || !raw.trim()) throw new Error("Empty input");
  try {
    return JSON.parse(raw.trim().replace(/\n\s*/g, ""));
  } catch (e) {
    throw new Error(`Invalid JSON: ${e.message}`, { cause: e });
  }
}

export function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeys(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function typeLabel(val) {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  return typeof val;
}

function walk(a, b, pathParts, results) {
  const pathStr = pathParts.join("/") || "(root)";
  const typeA = typeLabel(a);
  const typeB = typeLabel(b);

  if (typeA !== typeB) {
    results.push({
      path: pathStr,
      type: "type_mismatch",
      leftValue: a,
      rightValue: b,
      leftType: typeA,
      rightType: typeB,
    });
    return;
  }
  if (typeA === "array") {
    if (a.length !== b.length)
      results.push({
        path: pathStr,
        type: "array_length",
        leftValue: a.length,
        rightValue: b.length,
        leftType: "number",
        rightType: "number",
      });
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (i >= a.length)
        results.push({
          path: `${pathStr}[${i}]`,
          type: "missing_left",
          leftValue: undefined,
          rightValue: b[i],
          leftType: "undefined",
          rightType: typeLabel(b[i]),
        });
      else if (i >= b.length)
        results.push({
          path: `${pathStr}[${i}]`,
          type: "missing_right",
          leftValue: a[i],
          rightValue: undefined,
          leftType: typeLabel(a[i]),
          rightType: "undefined",
        });
      else walk(a[i], b[i], [...pathParts, `[${i}]`], results);
    }
    return;
  }
  if (typeA === "object") {
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of allKeys) {
      const hasA = Object.prototype.hasOwnProperty.call(a, key);
      const hasB = Object.prototype.hasOwnProperty.call(b, key);
      if (!hasA)
        results.push({
          path: [...pathParts, key].join("/"),
          type: "missing_left",
          leftValue: undefined,
          rightValue: b[key],
          leftType: "undefined",
          rightType: typeLabel(b[key]),
        });
      else if (!hasB)
        results.push({
          path: [...pathParts, key].join("/"),
          type: "missing_right",
          leftValue: a[key],
          rightValue: undefined,
          leftType: typeLabel(a[key]),
          rightType: "undefined",
        });
      else walk(a[key], b[key], [...pathParts, key], results);
    }
    return;
  }
  if (a !== b)
    results.push({
      path: pathStr,
      type: "value_mismatch",
      leftValue: a,
      rightValue: b,
      leftType: typeA,
      rightType: typeB,
    });
}

export function diffJSON(left, right, doSortKeys = true) {
  const a = doSortKeys ? sortKeys(left) : left;
  const b = doSortKeys ? sortKeys(right) : right;
  const results = [];
  walk(a, b, [], results);
  return results;
}

export function buildLineDiff(leftObj, rightObj, doSortKeys) {
  const a = doSortKeys ? sortKeys(leftObj) : leftObj;
  const b = doSortKeys ? sortKeys(rightObj) : rightObj;
  const leftLines = JSON.stringify(a, null, 2).split("\n");
  const rightLines = JSON.stringify(b, null, 2).split("\n");

  const result = [];
  let i = 0,
    j = 0;
  const m = leftLines.length,
    n = rightLines.length;

  while (i < m || j < n) {
    if (i < m && j < n && leftLines[i] === rightLines[j]) {
      result.push({ type: "same", left: leftLines[i], right: rightLines[j] });
      i++;
      j++;
    } else {
      let found = false;
      for (let look = 1; look <= 8; look++) {
        if (i + look < m && j < n && leftLines[i + look] === rightLines[j]) {
          for (let k = 0; k < look; k++)
            result.push({
              type: "removed",
              left: leftLines[i + k],
              right: null,
            });
          i += look;
          found = true;
          break;
        }
        if (j + look < n && i < m && leftLines[i] === rightLines[j + look]) {
          for (let k = 0; k < look; k++)
            result.push({
              type: "added",
              left: null,
              right: rightLines[j + k],
            });
          j += look;
          found = true;
          break;
        }
      }
      if (!found) {
        if (i < m && j < n) {
          const leftVal = leftLines[i]
            .trim()
            .replace(/,$/, "")
            .split(":")
            .slice(1)
            .join(":")
            .trim();
          const rightVal = rightLines[j]
            .trim()
            .replace(/,$/, "")
            .split(":")
            .slice(1)
            .join(":")
            .trim();
          const leftIsStr = leftVal.startsWith('"');
          const rightIsStr = rightVal.startsWith('"');
          const leftIsNum = !leftIsStr && !isNaN(Number(leftVal));
          const rightIsNum = !rightIsStr && !isNaN(Number(rightVal));
          const isTypeDiff =
            leftVal !== "" &&
            rightVal !== "" &&
            ((leftIsStr && !rightIsStr) ||
              (!leftIsStr && rightIsStr) ||
              leftIsNum !== rightIsNum);
          result.push({
            type: isTypeDiff ? "type_changed" : "changed",
            left: leftLines[i],
            right: rightLines[j],
          });
          i++;
          j++;
        } else if (i < m) {
          result.push({ type: "removed", left: leftLines[i], right: null });
          i++;
        } else {
          result.push({ type: "added", left: null, right: rightLines[j] });
          j++;
        }
      }
    }
  }
  return result;
}
