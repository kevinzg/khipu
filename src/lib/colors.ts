/**
 * Predefined set of player colors to pick from.
 * Tailwind 500/600 family hues, chosen to be visually distinct.
 */
export const PALETTE: string[] = [
    '#2563eb', // blue-600
    '#dc2626', // red-600
    '#22c55e', // green-500
    '#eab308', // yellow-500
    '#c026d3', // fuchsia-600
    '#ea580c', // orange-600
    '#0d9488', // teal-600
    '#4f46e5', // indigo-600
    '#db2777', // pink-600
    '#65a30d', // lime-600
    '#0891b2', // cyan-600
    '#475569', // slate-600
];

/**
 * Pick the first palette color not already in `used`, wrapping to the first
 * color when every palette entry is taken.
 */
export function nextColor(used: string[]): string {
    return PALETTE.find((c) => !used.includes(c)) ?? PALETTE[0];
}
