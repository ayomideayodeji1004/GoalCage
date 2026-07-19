export const TIERS = [
  { key: "bronze", label: "Bronze", color: "#B08D57" },
  { key: "silver", label: "Silver", color: "#C7CDD1" },
  { key: "gold", label: "Gold", color: "#E8B923" },
  { key: "platinum", label: "Platinum", color: "#7FD8E0" },
  { key: "diamond", label: "Diamond", color: "#6FA8FF" },
  { key: "optimus", label: "Optimus", color: "#FF6B4A" },
] as const;

export type TierKey = (typeof TIERS)[number]["key"];

export function tierIndex(tier: string): number {
  const i = TIERS.findIndex((t) => t.key === tier);
  return i === -1 ? 0 : i;
}

export function tierInfo(tier: string) {
  return TIERS[tierIndex(tier)];
}
