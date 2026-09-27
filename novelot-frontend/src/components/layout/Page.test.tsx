import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "./Page";

vi.mock("./TopBar", () => ({
    default: () => <header>Top bar</header>,
}));

describe("Page", () => {
    it("renders the top bar before the main content and places children inside main", () => {
        render(<Page><p>Page content</p></Page>);

        const header = screen.getByRole("banner");
        const main = screen.getByRole("main");

        expect(header).toHaveTextContent("Top bar");
        expect(within(main).getByText("Page content")).toBeInTheDocument();
        expect(header.nextElementSibling).toBe(main);
    });
});
