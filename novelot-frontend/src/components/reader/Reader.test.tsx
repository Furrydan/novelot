import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Reader from "./Reader";

function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/novels/:novelId/chapters/:chapterNumber"
          element={<Reader />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Reader", () => {
  it("Shows the novelId and chapterNumber from the URL", () => {
    renderAt("/novels/1/chapters/2");

    expect(screen.getByText("Novel 1, Chapter 2")).toBeInTheDocument();
  });
});
