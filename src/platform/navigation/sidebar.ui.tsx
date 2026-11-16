import type { ReactNode } from "react";
import "./styles.css";

/** Каркас панели: закреплённые области и прокручиваемое содержимое. */
export type SidebarProps = {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function Sidebar({ header, children, footer }: SidebarProps) {
  return (
    <div className="mm-sidebar">
      {header}
      <div className="mm-sidebar-scroll">{children}</div>
      {footer}
    </div>
  );
}
