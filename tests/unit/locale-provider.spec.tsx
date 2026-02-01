import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/lib/i18n/locale-context";
import { LOCALE_COOKIE } from "@/lib/i18n/locales";

function LocaleProbe() {
  const { locale, setLocale } = useLocale();
  return (
    <div>
      <span data-testid="locale-value">{locale}</span>
      <button type="button" onClick={() => setLocale("de")}>
        Switch to DE
      </button>
    </div>
  );
}

describe("LocaleProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = `${LOCALE_COOKIE}=; max-age=0; path=/`;
    document.documentElement.lang = "en";
  });

  it("persists locale changes to DOM and storage", async () => {
    /* Behavior: user switches locale via context.
       Expected: state updates, html lang updates, and locale is persisted. */
    render(
      <LocaleProvider initialLocale="en">
        <LocaleProbe />
      </LocaleProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /switch to de/i }));

    await waitFor(() => {
      expect(screen.getByTestId("locale-value")).toHaveTextContent("de");
      expect(document.documentElement.lang).toBe("de");
      expect(localStorage.getItem(LOCALE_COOKIE)).toBe("de");
      expect(document.cookie).toContain(`${LOCALE_COOKIE}=de`);
    });
  });
});
