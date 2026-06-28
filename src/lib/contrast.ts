/**
 * Calcul de contraste WCAG 2.x — pur, sans I/O.
 * Sert de base au gate d'accessibilité (contraste de la palette Cocon).
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

function parseHex(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) throw new Error(`Couleur hexadécimale invalide : ${hex}`);
  const value = m[1]!;
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

/** Linéarise un canal sRGB 8 bits (0-255) selon WCAG. */
function linearize(channel8: number): number {
  const c = channel8 / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Luminance relative d'une couleur hex (#rrggbb). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Ratio de contraste WCAG entre deux couleurs hex (toujours ≥ 1). */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
