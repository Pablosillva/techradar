import type { LucideIcon } from "lucide-react";
import {
  Braces,
  FileJson,
  Fingerprint,
  Hash,
  ImageDown,
  KeyRound,
  Landmark,
  Percent,
  QrCode,
  Ruler,
  Scaling,
  ShieldCheck,
  Text,
} from "lucide-react";
import type { IconName } from "@/lib/tools";

/**
 * Maps the icon names stored in the tool registry (strings, so the registry
 * stays serialisable and importable from server-only code) to real components.
 */
const icons: Record<IconName, LucideIcon> = {
  braces: Braces,
  fileJson: FileJson,
  keyRound: KeyRound,
  landmark: Landmark,
  qrCode: QrCode,
  imageDown: ImageDown,
  scaling: Scaling,
  text: Text,
  ruler: Ruler,
  percent: Percent,
  fingerprint: Fingerprint,
  shieldCheck: ShieldCheck,
  hash: Hash,
};

export function ToolIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const Icon = icons[name];
  return <Icon className={className} aria-hidden="true" />;
}
