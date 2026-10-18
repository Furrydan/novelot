import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import type { ReactNode } from "react";

vi.mock("@components/layout/Page", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@components/search/NovelSearch", () => ({
  default: () => <div>search page</div>,
}));

vi.mock("@components/reader/Reader", () => ({
  default: () => <div>reader page</div>,
}));

describe("#routes", () => {
  it("Shows correct default route", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("search page")).toBeInTheDocument();
  });

  it("Shows the reader on a chapter route", () => {
    render(
      <MemoryRouter initialEntries={["/novels/1/chapters/2"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("reader page")).toBeInTheDocument();
  });
});
