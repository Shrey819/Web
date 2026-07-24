export function generateProductSvg(
  category: "sensors" | "plcs" | "drives",
  title: string,
  model: string,
  variant: number = 1
): string {
  const bgGradient =
    category === "sensors"
      ? ["#030712", "#0f172a", "#1e3a8a"]
      : category === "plcs"
      ? ["#022c22", "#064e3b", "#0f172a"]
      : ["#1c1917", "#451a03", "#0f172a"];

  const accentHex =
    category === "sensors" ? "#38bdf8" : category === "plcs" ? "#34d399" : "#fbbf24";

  const iconDrawings = {
    sensors: `
      <!-- Sensor Lens / Beam -->
      <circle cx="200" cy="160" r="45" fill="none" stroke="${accentHex}" stroke-width="3" opacity="0.6"/>
      <circle cx="200" cy="160" r="28" fill="${accentHex}" fill-opacity="0.15" stroke="${accentHex}" stroke-width="2"/>
      <circle cx="200" cy="160" r="12" fill="${accentHex}"/>
      <line x1="200" y1="90" x2="200" y2="230" stroke="${accentHex}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.5"/>
      <line x1="130" y1="160" x2="270" y2="160" stroke="${accentHex}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.5"/>
      <path d="M120 160 Q 200 ${120 + variant * 10} 280 160" fill="none" stroke="${accentHex}" stroke-width="2" opacity="0.7"/>
    `,
    plcs: `
      <!-- PLC CPU Rack & Connectors -->
      <rect x="130" y="100" width="140" height="130" rx="8" fill="#1e293b" stroke="${accentHex}" stroke-width="2"/>
      <rect x="145" y="115" width="45" height="100" rx="4" fill="#0f172a" stroke="${accentHex}" stroke-width="1" opacity="0.8"/>
      <rect x="200" y="115" width="55" height="40" rx="4" fill="#020617"/>
      <!-- LED indicators -->
      <circle cx="158" cy="130" r="4" fill="${accentHex}"/>
      <circle cx="172" cy="130" r="4" fill="#22c55e"/>
      <circle cx="158" cy="145" r="4" fill="${accentHex}"/>
      <circle cx="172" cy="145" r="4" fill="#eab308"/>
      <!-- Terminal pins -->
      <line x1="210" y1="170" x2="245" y2="170" stroke="${accentHex}" stroke-width="2"/>
      <line x1="210" y1="180" x2="245" y2="180" stroke="${accentHex}" stroke-width="2"/>
      <line x1="210" y1="190" x2="245" y2="190" stroke="${accentHex}" stroke-width="2"/>
    `,
    drives: `
      <!-- VFD / Servo Motor Heatsink -->
      <rect x="140" y="90" width="120" height="140" rx="10" fill="#1c1917" stroke="${accentHex}" stroke-width="2"/>
      <!-- Fins -->
      <line x1="160" y1="110" x2="160" y2="210" stroke="${accentHex}" stroke-width="3" opacity="0.7"/>
      <line x1="180" y1="110" x2="180" y2="210" stroke="${accentHex}" stroke-width="3" opacity="0.7"/>
      <line x1="200" y1="110" x2="200" y2="210" stroke="${accentHex}" stroke-width="3" opacity="0.7"/>
      <line x1="220" y1="110" x2="220" y2="210" stroke="${accentHex}" stroke-width="3" opacity="0.7"/>
      <line x1="240" y1="110" x2="240" y2="210" stroke="${accentHex}" stroke-width="3" opacity="0.7"/>
      <!-- Keypad -->
      <rect x="165" y="125" width="70" height="35" rx="4" fill="#000" stroke="${accentHex}" stroke-width="1"/>
      <text x="200" y="147" font-family="monospace" font-size="12" fill="${accentHex}" text-anchor="middle" font-weight="bold">60.0 Hz</text>
    `
  };

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" width="100%" height="100%">
      <defs>
        <linearGradient id="bgGrad_${category}_${variant}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgGradient[0]}"/>
          <stop offset="60%" stop-color="${bgGradient[1]}"/>
          <stop offset="100%" stop-color="${bgGradient[2]}"/>
        </linearGradient>
        <pattern id="grid_${category}_${variant}" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </pattern>
      </defs>
      
      <!-- Background -->
      <rect width="400" height="320" fill="url(#bgGrad_${category}_${variant})" />
      <rect width="400" height="320" fill="url(#grid_${category}_${variant})" />
      
      <!-- Ambient Glow -->
      <circle cx="200" cy="160" r="100" fill="${accentHex}" fill-opacity="0.12" filter="blur(20px)"/>
      
      <!-- Main Icon -->
      ${iconDrawings[category]}

      <!-- Brand / Technical Spec Overlay -->
      <rect x="20" y="20" width="110" height="22" rx="4" fill="rgba(0,0,0,0.6)" stroke="${accentHex}" stroke-width="0.8"/>
      <text x="75" y="35" font-family="sans-serif" font-size="10" fill="#f8fafc" text-anchor="middle" font-weight="600" letter-spacing="1">
        ${category.toUpperCase()} // V${variant}
      </text>

      <text x="380" y="35" font-family="monospace" font-size="11" fill="${accentHex}" text-anchor="end" opacity="0.9">
        ${model}
      </text>

      <!-- Bottom Part Title Banner -->
      <rect x="20" y="275" width="360" height="28" rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255,255,255,0.1)"/>
      <text x="35" y="293" font-family="sans-serif" font-size="11" fill="#e2e8f0" font-weight="500">
        ${title.length > 42 ? title.substring(0, 40) + "..." : title}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}
