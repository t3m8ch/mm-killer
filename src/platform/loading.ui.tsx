import { Brand } from "./brand.ui.tsx";
import "./loading.css";

export function LoadingScreen() {
  return (
    <div className="mm-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="mm-loading-content">
        <div aria-hidden="true">
          <Brand />
        </div>
        <div className="mm-loading-track" aria-hidden="true">
          <span />
        </div>
        <p>Загружаем приложение</p>
      </div>
    </div>
  );
}
