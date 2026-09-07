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

/**
 * Normalizes text for similarity comparison (lowercase, alphanumeric, normalized whitespace).
 */
export function normalizeSimilarityText(s: unknown): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "") // strip non-ascii / weird characters
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Computes Jaccard word-token similarity between two text strings.
 */
export function computeTokenSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  const s1 = normalizeSimilarityText(str1);
  const s2 = normalizeSimilarityText(str2);
  if (s1 === s2) return 1.0;

  const tokens1 = new Set(s1.split(/\s+/).filter(Boolean));
  const tokens2 = new Set(s2.split(/\s+/).filter(Boolean));
  if (tokens1.size === 0 && tokens2.size === 0) return 1.0;
  if (tokens1.size === 0 || tokens2.size === 0) return 0.0;

  let intersection = 0;
  tokens1.forEach((t) => {
    if (tokens2.has(t)) intersection++;
  });
  const union = new Set([...tokens1, ...tokens2]).size;
  return intersection / union;
}

/**
 * Computes Jaccard set similarity between two string arrays.
 */
export function computeSetSimilarity(arr1: string[], arr2: string[]): number {
  const set1 = new Set((arr1 || []).map(normalizeSimilarityText).filter(Boolean));
  const set2 = new Set((arr2 || []).map(normalizeSimilarityText).filter(Boolean));
  if (set1.size === 0 && set2.size === 0) return 1.0;
  if (set1.size === 0 || set2.size === 0) return 0.0;

  let intersection = 0;
  set1.forEach((item) => {
    if (set2.has(item)) intersection++;
  });
  const union = new Set([...set1, ...set2]).size;
  return intersection / union;
}

/**
 * Evaluates whether an incoming product matches an existing database product by detail similarity.
 * Returns { isMatch: boolean, score: number } where score is between 0 and 100.
 * Threshold is 90% (0.90).
 */
export function calculateProductDetailSimilarity(
  incoming: {
    name: string;
    description?: string | null;
    price?: number | null;
    brand?: string | null;
    category?: string | null;
    features?: Array<{ label: string; value: string }>;
    applications?: string[];
  },
  existing: {
    name: string;
    description?: string | null;
    price?: number | null;
    brand?: string | null;
    categoryName?: string | null;
    featureHighlights?: any;
    applications?: any;
  },
  threshold = 90
): { isMatch: boolean; score: number } {
  const W_NAME = 30;
  const W_DESC = 15;
  const W_FEATURES = 20;
  const W_APPS = 10;
  const W_BRAND = 10;
  const W_CAT = 10;
  const W_PRICE = 5;

  // 1. Name
  const nameScore = computeTokenSimilarity(incoming.name, existing.name);

  // 2. Description
  const descScore = computeTokenSimilarity(incoming.description || "", existing.description || "");

  // 3. Brand
  const b1 = normalizeSimilarityText(incoming.brand);
  const b2 = normalizeSimilarityText(existing.brand);
  const brandScore = !b1 && !b2 ? 1.0 : b1 === b2 ? 1.0 : 0.0;

  // 4. Category
  const c1 = normalizeSimilarityText(incoming.category);
  const c2 = normalizeSimilarityText(existing.categoryName);
  const catScore = !c1 && !c2 ? 1.0 : c1 === c2 ? 1.0 : 0.0;

  // 5. Feature Highlights
  const f1 = incoming.features || [];
  const rawF2 = existing.featureHighlights;
  const f2: Array<{ label: string; value: string }> = Array.isArray(rawF2)
    ? rawF2
    : typeof rawF2 === "string"
    ? (() => {
        try {
          return JSON.parse(rawF2);
        } catch {
          return [];
        }
      })()
    : [];

  let featScore = 0;
  if (f1.length === 0 && f2.length === 0) {
    featScore = 1.0;
  } else if (f1.length === 0 || f2.length === 0) {
    featScore = 0.0;
  } else {
    let matched = 0;
    f1.forEach((featA) => {
      const normLabelA = normalizeSimilarityText(featA.label);
      const match = f2.find((featB) => normalizeSimilarityText(featB.label) === normLabelA);
      if (match) {
        const normValA = normalizeSimilarityText(featA.value);
        const normValB = normalizeSimilarityText(match.value);
        if (normValA === normValB || normValA.includes(normValB) || normValB.includes(normValA)) {
          matched += 1.0;
        } else {
          matched += 0.5;
        }
      }
    });
    featScore = matched / Math.max(f1.length, f2.length);
  }

  // 6. Applications
  const rawApps = existing.applications;
  const a2: string[] = Array.isArray(rawApps)
    ? rawApps
    : typeof rawApps === "string"
    ? (() => {
        try {
          return JSON.parse(rawApps);
        } catch {
          return [];
        }
      })()
    : [];
  const appScore = computeSetSimilarity(incoming.applications || [], a2);

  // 7. Price
  const p1 = incoming.price != null && !isNaN(incoming.price) ? Number(incoming.price) : null;
  const p2 = existing.price != null ? Number(existing.price) / 100 : null; // existing in paise
  let priceScore = 1.0;
  if (p1 != null && p2 != null && p1 > 0 && p2 > 0) {
    priceScore = Math.min(p1, p2) / Math.max(p1, p2);
  }

  const total =
    nameScore * W_NAME +
    descScore * W_DESC +
    featScore * W_FEATURES +
    appScore * W_APPS +
    brandScore * W_BRAND +
    catScore * W_CAT +
    priceScore * W_PRICE;

  const score = Math.round(total * 10) / 10;
  return {
    isMatch: score >= threshold,
    score,
  };
}

