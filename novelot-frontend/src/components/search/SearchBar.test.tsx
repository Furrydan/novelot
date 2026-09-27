import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import novelList from "@assets/novelList.json" with { type: "json" };
import { isNovel } from "@novelot-types/Novel";
import SearchBar from "./SearchBar";
import useNovels from "./logic/UseNovels";

vi.mock("./logic/UseNovels", () => ({
    default: vi.fn(),
}));

const novels = novelList.filter(isNovel).slice(0, 2);

describe("SearchBar", () => {
    afterEach(() => {
        cleanup();
        vi.resetAllMocks();
    });

    it("updates the visible input value and searches with the new text", async () => {
        vi.mocked(useNovels).mockReturnValue([]);
        render(<SearchBar />);

        const input = screen.getByRole("textbox");
        expect(input).toHaveValue("");

        await user.type(input, "mars");

        expect(input).toHaveValue("mars");
        expect(useNovels).toHaveBeenLastCalledWith("mars", 1, expect.any(Function), 5);
    });

    it("opens the dropdown and displays the returned novels for a nonempty search", async () => {
        vi.mocked(useNovels).mockReturnValue(novels);
        const { container } = render(<SearchBar />);
        const dropdown = container.querySelector(".searchbar-dropdown");

        expect(dropdown).toHaveClass("searchbar-dropdown-closed");

        await user.type(screen.getByRole("textbox"), "novel");

        expect(dropdown).toHaveClass("searchbar-dropdown--open");
        expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(
            novels.map((novel) => novel.title),
        );
    });

    it("keeps the dropdown closed when a nonempty search has no results", async () => {
        vi.mocked(useNovels).mockReturnValue([]);
        const { container } = render(<SearchBar />);
        const dropdown = container.querySelector(".searchbar-dropdown");

        await user.type(screen.getByRole("textbox"), "missing");

        expect(dropdown).toHaveClass("searchbar-dropdown-closed");
        expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    });

    it("closes the dropdown when the search is cleared, even if novels are returned", async () => {
        vi.mocked(useNovels).mockReturnValue(novels);
        const { container } = render(<SearchBar />);
        const dropdown = container.querySelector(".searchbar-dropdown");
        const input = screen.getByRole("textbox");

        await user.type(input, "novel");
        expect(dropdown).toHaveClass("searchbar-dropdown--open");

        await user.clear(input);

        expect(input).toHaveValue("");
        expect(dropdown).toHaveClass("searchbar-dropdown-closed");
    });
});
