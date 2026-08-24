/**
 * Helper utilities for spreadsheet parsing, option alignment, and slug generation.
 */

export function cleanVal(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

export function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || "product-" + Date.now()
  );
}

/**
 * Smart Option Column Alignment & Missing Field Auto-Fill
 */
export function autoAlignSpreadsheetOptions(
  headers: string[],
  rows: string[][]
): { headers: string[]; rows: string[][]; alignedChangesCount: number } {
  const headerLower = headers.map((h) => cleanVal(h).toLowerCase());
  const findColIdx = (...aliases: string[]): number => {
    for (const alias of aliases) {
      const idx = headerLower.findIndex(
        (h) => h === alias.toLowerCase() || h.includes(alias.toLowerCase())
      );
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const productNoIdx = findColIdx("product no", "product_no", "handle", "slug", "sku", "id");
  const itemTypeIdx = findColIdx("item type", "item_type", "type", "fieldtype");
  const nameIdx = findColIdx("name", "title", "product name");

  const optionColIndices: Array<{ nameIdx: number; valIdx: number }> = [];
  for (let o = 1; o <= 6; o++) {
    const nIdx = findColIdx(`option ${o} name`, `productoptionname${o}`);
    const vIdx = findColIdx(`option ${o} value`, `productoptionchoices${o}`, `productoptionchoice${o}`);
    optionColIndices.push({ nameIdx: nIdx, valIdx: vIdx });
  }

  // If no option columns found, return unchanged
  if (optionColIndices.every((c) => c.nameIdx === -1 || c.valIdx === -1)) {
    return { headers, rows, alignedChangesCount: 0 };
  }

  let alignedChangesCount = 0;
  const newRows = rows.map((r) => [...r]);

  let currentParentIdx: number | null = null;
  let parentOptions: Array<{ name: string; choices: string[] }> = [];

  for (let rIdx = 0; rIdx < newRows.length; rIdx++) {
    const row = newRows[rIdx];
    const isRowEmpty = row.every((c) => !cleanVal(c));
    if (isRowEmpty) continue;

    const getVal = (idx: number) => (idx !== -1 && row[idx] != null ? cleanVal(row[idx]) : "");

    const pNo = getVal(productNoIdx);
    const itType = getVal(itemTypeIdx).toLowerCase();
    const pName = getVal(nameIdx);

    const isVariant =
      itType === "variant" ||
      (pNo.includes("_") && !pName) ||
      (!pName && !itType && currentParentIdx !== null);

    if (!isVariant) {
      currentParentIdx = rIdx;
      // 1. Gather all options defined on parent row
      const rawParentOptions: Array<{ name: string; rawVal: string; choices: string[] }> = [];
      for (let o = 0; o < 6; o++) {
        const { nameIdx: nIdx, valIdx: vIdx } = optionColIndices[o];
        let oName = getVal(nIdx);
        const oVal = getVal(vIdx);

        if (oVal && !oName) {
          // Infer option name from common choice values
          if (oVal.includes("V") || oVal.includes("24") || oVal.includes("230")) oName = "Voltage";
          else if (
            oVal.toLowerCase().includes("red") ||
            oVal.toLowerCase().includes("green") ||
            oVal.toLowerCase().includes("yellow")
          )
            oName = "Color";
          else if (
            oVal.toLowerCase().includes("metal") ||
            oVal.toLowerCase().includes("plastic")
          )
            oName = "Texture";
          else oName = `Option ${rawParentOptions.length + 1}`;
        }

        if (oName && oVal) {
          const choices = oVal.split(/[;,]/).map((c) => c.trim()).filter(Boolean);
          if (choices.length > 0) {
            rawParentOptions.push({ name: oName, rawVal: oVal, choices });
          }
        }
      }

      parentOptions = rawParentOptions.map((o) => ({ name: o.name, choices: o.choices }));

      // 2. Compact & align parent row options into slots 1..N
      for (let o = 0; o < 6; o++) {
        const { nameIdx: nIdx, valIdx: vIdx } = optionColIndices[o];
        if (nIdx !== -1 && vIdx !== -1) {
          const targetOpt = rawParentOptions[o];
          const newName = targetOpt ? targetOpt.name : "";
          const newVal = targetOpt ? targetOpt.rawVal : "";

          if (row[nIdx] !== newName || row[vIdx] !== newVal) {
            row[nIdx] = newName;
            row[vIdx] = newVal;
            alignedChangesCount++;
          }
        }
      }
    } else {
      // Variant row alignment
      if (parentOptions.length > 0) {
        const specifiedAttrs: Record<string, string> = {};

        for (let o = 0; o < 6; o++) {
          const { nameIdx: nIdx, valIdx: vIdx } = optionColIndices[o];
          const oName = getVal(nIdx);
          const oVal = getVal(vIdx);

          if (oVal) {
            let matchedOptName = oName;

            const validParentOpt = parentOptions.find(
              (p) => p.name.toLowerCase().trim() === oName.toLowerCase().trim()
            );
            const isValidChoice = validParentOpt?.choices.some(
              (c) => c.toLowerCase().trim() === oVal.toLowerCase().trim()
            );

            if (!isValidChoice || !oName) {
              const actualParentOpt = parentOptions.find((p) =>
                p.choices.some((c) => c.toLowerCase().trim() === oVal.toLowerCase().trim())
              );
              if (actualParentOpt) {
                matchedOptName = actualParentOpt.name;
              } else if (validParentOpt) {
                matchedOptName = validParentOpt.name;
              }
            }

            if (matchedOptName) {
              specifiedAttrs[matchedOptName.toLowerCase().trim()] = oVal;
            }
          }
        }

        // Place attributes in the exact slots matching parent options order
        for (let o = 0; o < 6; o++) {
          const { nameIdx: nIdx, valIdx: vIdx } = optionColIndices[o];
          if (nIdx !== -1 && vIdx !== -1) {
            const pOpt = parentOptions[o];
            let newName = "";
            let newVal = "";

            if (pOpt) {
              const matchedVal = specifiedAttrs[pOpt.name.toLowerCase().trim()];
              if (matchedVal) {
                newName = pOpt.name;
                newVal = matchedVal;
              }
            }

            if (row[nIdx] !== newName || row[vIdx] !== newVal) {
              row[nIdx] = newName;
              row[vIdx] = newVal;
              alignedChangesCount++;
            }
          }
        }
      }
    }
  }

  return { headers, rows: newRows, alignedChangesCount };
}
