import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Drawer, Loader, Menu, Tooltip, useMantineColorScheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  CaretRightIcon,
  CheckIcon,
  DesktopIcon,
  MoonIcon,
  SidebarSimpleIcon,
  SunIcon,
} from "@phosphor-icons/react";
import type { Breadcrumb } from "../public.shared.ts";
import "./styles.css";

export type AppLayoutProps = {
  children: ReactNode;
  path: string;
  breadcrumbs: readonly Breadcrumb[];
  mode?: "normal" | "diff";
  pending?: boolean;
  renderSidebar: (options: { drawer: boolean }) => ReactNode;
};

function ThemeMenu() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const options = [
    { value: "light", label: "Светлая", icon: SunIcon },
    { value: "dark", label: "Тёмная", icon: MoonIcon },
    { value: "auto", label: "Системная", icon: DesktopIcon },
  ] as const;

  return (
    <Menu position="bottom-end">
      <Menu.Target>
        <Tooltip label="Тема оформления">
          <button className="mm-theme-button" aria-label="Тема оформления">
            <SunIcon size={18} />
          </button>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        {options.map(({ value, label, icon: Icon }) => (
          <Menu.Item
            key={value}
            leftSection={<Icon size={18} />}
            rightSection={colorScheme === value ? <CheckIcon size={14} /> : undefined}
            onClick={() => setColorScheme(value)}
          >
            {label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

export function AppLayout(props: AppLayoutProps) {
  const { path, mode = "normal", breadcrumbs, children, pending, renderSidebar } = props;
  const mobile = useMediaQuery("(max-width: 720px)");
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [previousPath, setPreviousPath] = useState(path);

  if (previousPath !== path) {
    setPreviousPath(path);
    setDrawer(false);
    setCollapsed(false);
  }

  return (
    <div className="mm-root">
      <div className={`mm-shell${mode === "diff" || collapsed ? " mm-hidden" : ""}`}>
        <aside className="mm-permanent" aria-label="Основная навигация">
          {renderSidebar({ drawer: false })}
        </aside>
        <div className="mm-work">
          <header className="mm-header">
            <button
              className="mm-panel-toggle"
              aria-label="Переключить навигацию"
              aria-expanded={drawer || (!collapsed && mode !== "diff" && !mobile)}
              onClick={() =>
                mobile || mode === "diff" ? setDrawer(true) : setCollapsed((value) => !value)
              }
            >
              <SidebarSimpleIcon size={20} />
            </button>
            <nav className="mm-breadcrumbs" aria-label="Хлебные крошки">
              <ol>
                {breadcrumbs.map((crumb, index) => (
                  <li key={crumb.href}>
                    {index > 0 && <CaretRightIcon size={12} aria-hidden="true" />}
                    {index === breadcrumbs.length - 1 ? (
                      <span aria-current="page" title={crumb.label}>
                        {crumb.label}
                      </span>
                    ) : (
                      <Link activeOptions={{ exact: true }} to={crumb.href} title={crumb.label}>
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
            {pending && <Loader size={14} aria-label="Загрузка страницы" />}
            <ThemeMenu />
          </header>
          <main className={mode === "diff" ? "mm-diff-page" : "mm-page"} aria-busy={pending}>
            <div inert={pending}>{children}</div>
          </main>
        </div>
      </div>
      <Drawer
        closeButtonProps={{ "aria-label": "Закрыть навигацию" }}
        opened={drawer}
        onClose={() => setDrawer(false)}
        size={300}
        title={
          <Link
            activeOptions={{ exact: true }}
            to="/"
            className="mm-drawer-brand"
            onClick={() => setDrawer(false)}
          >
            MergeMinds
          </Link>
        }
        classNames={{
          content: "mm-drawer-surface",
          body: "mm-drawer-body",
          header: "mm-drawer-header",
        }}
      >
        <div
          className="mm-drawer-content"
          onClickCapture={(event) => {
            // Переход выполняет Link; здесь только закрытие панели, в том числе для текущей страницы.
            if (
              event.button === 0 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey &&
              event.target instanceof Element &&
              event.target.closest("a[href]")
            ) {
              setDrawer(false);
            }
          }}
        >
          {renderSidebar({ drawer: true })}
        </div>
      </Drawer>
    </div>
  );
}
