import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    React.createElement("a", { href, ...rest }, children),
}));

vi.mock("@/lib/i18n/use-echo", () => ({
  useEcho: () => ({
    echo: (key: string) => key,
  }),
}));

afterEach(() => {
  cleanup();
});
