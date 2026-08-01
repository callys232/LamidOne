/** Shared between PricingSidebar (which builds the links) and
 *  FeatureMatrix (which owns the anchors being linked to) — both must
 *  derive the same id from the same group name or the jump breaks. */
export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
