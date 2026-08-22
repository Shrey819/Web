export interface OptionChoiceInput {
  id?: string;
  name: string;
  colorHex?: string;
}

export interface OptionInput {
  id?: string;
  name: string;
  fieldType?: "TEXT_CHOICES" | "SWATCH_CHOICES";
  choices: OptionChoiceInput[];
}

export interface GeneratedVariant {
  id?: string;
  sku: string;
  barcode: string;
  price: number;
  strikethroughPrice?: number | null;
  cost?: number | null;
  trackQuantity: boolean;
  stockQuantity: number;
  inventoryStatus: "IN_STOCK" | "OUT_OF_STOCK";
  preOrderEnabled: boolean;
  preOrderLimit?: number | null;
  totalUnits?: number | null;
  totalUnitsMeasurement: string;
  packageLength?: number | null;
  packageWidth?: number | null;
  packageHeight?: number | null;
  packageUnit: string;
  mediaUrl: string;
  attributes: Record<string, string>;
  displayName: string;
}

/**
 * Generate Cartesian combinations of options while preserving existing variant overrides.
 */
export function generateCartesianVariants(
  options: OptionInput[],
  basePrice: number,
  strikethroughPrice?: number | null,
  baseSku?: string,
  existingVariants: GeneratedVariant[] = []
): GeneratedVariant[] {
  const activeOptions = options.filter((o) => o.choices && o.choices.length > 0);
  if (activeOptions.length === 0) return [];

  // Helper to compute Cartesian product
  const cartesian = (arrays: { optionName: string; choiceName: string }[][]) => {
    return arrays.reduce<{ optionName: string; choiceName: string }[][]>(
      (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
      [[]]
    );
  };

  const choiceArrays = activeOptions.map((opt) =>
    opt.choices.map((c) => ({ optionName: opt.name, choiceName: c.name }))
  );

  const combinations = cartesian(choiceArrays);

  // Map of existing variants keyed by JSON stringified sorted attributes
  const existingMap = new Map<string, GeneratedVariant>();
  existingVariants.forEach((v) => {
    const key = Object.entries(v.attributes || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, val]) => `${k}:${val}`)
      .join("|");
    existingMap.set(key, v);
  });

  return combinations.map((combo, index) => {
    const attributes: Record<string, string> = {};
    combo.forEach((item) => {
      attributes[item.optionName] = item.choiceName;
    });

    const key = Object.entries(attributes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, val]) => `${k}:${val}`)
      .join("|");

    const existing = existingMap.get(key);
    const displayName = combo.map((c) => c.choiceName).join(" | ");
    const defaultSku = baseSku ? `${baseSku}-${index + 1}` : `VAR-${10001 + index}`;

    if (existing) {
      return {
        ...existing,
        attributes,
        displayName,
        sku: existing.sku || defaultSku,
        barcode: existing.barcode || "",
        totalUnitsMeasurement: existing.totalUnitsMeasurement || "g",
        packageUnit: existing.packageUnit || "cm",
        mediaUrl: existing.mediaUrl || "",
      };
    }

    return {
      sku: defaultSku,
      barcode: "",
      price: basePrice,
      strikethroughPrice: strikethroughPrice || null,
      cost: null,
      trackQuantity: false,
      stockQuantity: 100,
      inventoryStatus: "IN_STOCK",
      preOrderEnabled: false,
      preOrderLimit: null,
      totalUnits: 25,
      totalUnitsMeasurement: "g",
      packageLength: 25,
      packageWidth: 25,
      packageHeight: 20,
      packageUnit: "cm",
      mediaUrl: "",
      attributes,
      displayName,
    };
  });
}
