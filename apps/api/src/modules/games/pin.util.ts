/** Generates a random 6-digit game PIN as a string (e.g. "042317"). */
export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
