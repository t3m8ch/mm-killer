import { GitMergeIcon } from "@phosphor-icons/react";
import "./loading.css";

export function LoadingScreen() {
  return (
    <div className="mm-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="mm-loading-content">
        <div className="mm-loading-brand" aria-hidden="true">
          <span className="mm-loading-mark">
            <GitMergeIcon size={28} weight="bold" />
          </span>
          <span>MergeMinds</span>
        </div>
        <div className="mm-loading-track" aria-hidden="true">
          <span />
        </div>
        <p>Загружаем приложение</p>
      </div>
    </div>
  );
}
