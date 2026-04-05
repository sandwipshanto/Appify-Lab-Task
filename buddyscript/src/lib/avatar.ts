/**
 * Generates a deterministic avatar URL for a user based on their name.
 * Uses UI Avatars (no external dependency at runtime — just a CDN URL)
 * or can be switched to a local SVG data URI approach.
 *
 * Each user gets a unique background color derived from their name,
 * so avatars are visually distinct and consistent.
 */

const PALETTE = [
  // Vibrant but tasteful hues
  '4F46E5', // indigo
  '7C3AED', // violet
  'DB2777', // pink
  'DC2626', // red
  'D97706', // amber
  '059669', // emerald
  '0284C7', // sky blue
  '0891B2', // cyan
  '9333EA', // purple
  'EA580C', // orange
  '16A34A', // green
  '2563EB', // blue
  'BE185D', // fuchsia
  '0F766E', // teal
  'B45309', // yellow-brown
  '6D28D9', // deep violet
];

/**
 * Picks a deterministic color from PALETTE based on the string.
 */
function pickColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // Convert to 32-bit int
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

/**
 * Returns a UI Avatars CDN URL for the given first/last name.
 * This produces a colored circle with initials — no real person image.
 */
export function generateAvatarUrl(firstName: string, lastName: string): string {
  const name = `${firstName}+${lastName}`;
  const color = pickColor(`${firstName}${lastName}`.toLowerCase());
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=128&bold=true&format=png`;
}
