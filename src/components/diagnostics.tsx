"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useExplorerConfig } from "@/lib/hooks/use-explorer-config";

type DiagEntry = {
  ts: string;
  type: "info" | "error";
  payload: Record<string, unknown>;
};

type DiagStore = {
  entries: DiagEntry[];
};

const ensureStore = (): DiagStore => {
  const win = window as unknown as { __PHA_DIAG__?: DiagStore };
  if (!win.__PHA_DIAG__) {
    win.__PHA_DIAG__ = { entries: [] };
  }
  return win.__PHA_DIAG__;
};

const pushEntry = (
  type: DiagEntry["type"],
  payload: Record<string, unknown>,
  logToConsole: boolean,
) => {
  const entry: DiagEntry = {
    ts: new Date().toISOString(),
    type,
    payload,
  };
  const store = ensureStore();
  store.entries.push(entry);
  if (!logToConsole) return;
  const label = "[pha-explorer][diag]";
  if (type === "error") {
    console.error(label, entry);
  } else {
    console.warn(label, entry);
  }
};

export function Diagnostics() {
  const pathname = usePathname();
  const { config } = useExplorerConfig();
  const enabled = Boolean(config.diagnostics?.enabled);
  const logToConsole = enabled;

  useEffect(() => {
    if (!enabled) return undefined;

    pushEntry(
      "info",
      {
        event: "mounted",
        href: window.location.href,
        pathname,
        userAgent: navigator.userAgent,
        config: {
          nexus: config.nexus,
          apiBaseUrl: config.apiBaseUrl,
        },
      },
      logToConsole,
    );

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest("a") as HTMLAnchorElement | null;
      if (!link) return;
      pushEntry(
        "info",
        {
          event: "link-click",
          href: link.href,
          text: link.textContent?.trim() ?? "",
        },
        logToConsole,
      );
    };

    const handleError = (event: ErrorEvent) => {
      pushEntry(
        "error",
        {
          event: "error",
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error instanceof Error ? event.error.stack : undefined,
        },
        logToConsole,
      );
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error
          ? event.reason.stack ?? event.reason.message
          : event.reason;
      pushEntry(
        "error",
        {
          event: "unhandledrejection",
          reason,
        },
        logToConsole,
      );
    };

    window.addEventListener("click", handleClick, true);
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [config.apiBaseUrl, config.nexus, enabled, logToConsole, pathname]);

  useEffect(() => {
    if (!enabled) return;
    pushEntry(
      "info",
      {
        event: "route",
        pathname,
      },
      logToConsole,
    );
  }, [enabled, logToConsole, pathname]);

  return null;
}
