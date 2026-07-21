import {
  Brain,
  Briefcase,
  Heart,
  HeartPulse,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const AREA_ICONS: Record<string, LucideIcon> = {
  Brain,
  HeartPulse,
  Briefcase,
  Wallet,
  Heart,
  Sparkles,
};

export function getAreaIcon(icon: string): LucideIcon {
  return AREA_ICONS[icon] ?? Sparkles;
}
