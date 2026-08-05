import type { ReactNode } from "react";

type PortalBadgeProps = {
  children: ReactNode;
  state: "imported" | "playable" | "locked";
};

export function PortalBadge({ children, state }: PortalBadgeProps) {
  return <span className={`portal-badge portal-badge--${state}`}>{children}</span>;
}
