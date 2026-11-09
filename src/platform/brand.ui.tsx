import { GitMergeIcon } from "@phosphor-icons/react";
import "./brand.css";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`mm-brand-lockup${compact ? " mm-brand-compact" : ""}`}>
      <span className="mm-brand-mark" aria-hidden="true">
        <GitMergeIcon size={compact ? 22 : 28} weight="bold" />
      </span>
      <span>MergeMinds</span>
    </span>
  );
}
