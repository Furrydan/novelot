import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";
import type { ReactNode } from "react";

vi.mock("@components/layout/Page", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@components/search/NovelSearch", () => ({
  default: () => <div>search page</div>,
}));

describe("#routes", () => {
  it("Shows correct default route", () => {
    window.history.pushState({}, "", "/");
    render(<App />);

    expect(screen.getByText("search page")).toBeInTheDocument();
  });
});
