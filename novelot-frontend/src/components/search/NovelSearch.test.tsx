import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import user from "@testing-library/user-event"
import NovelSearch from "./NovelSearch";
import useNovels from "./logic/useNovels";
import novelList from "@assets/novelList.json" with {type: 'json'}
import { type Novel, isNovel } from "../../types/Types";

vi.mock("./logic/useNovels.js", () => ({
    default: vi.fn()
}))

const novels: Novel[] = novelList.filter(isNovel).slice(0, 48)

describe("NovelSearch", () => {
    vi.mocked(useNovels).mockReturnValue(novels)

    afterEach(() => {
        vi.clearAllMocks()
        cleanup()
    })

    it("Renders all values correctly", async () => {

        render(<NovelSearch />)

        expect(screen.getAllByRole('img')).toHaveLength(novels.length)
        expect(useNovels).toHaveBeenLastCalledWith("", 1, expect.any(Function), 24)
    })

    it("Does not go to page 0", async () => {
        render(<NovelSearch />)

        const callsBefore = vi.mocked(useNovels).mock.calls.length
        await user.click(screen.getByRole('button', { name: 'Previous Page' }))
        expect(useNovels).toHaveBeenCalledTimes(callsBefore)
        expect(useNovels).toHaveBeenCalledWith("", 1, expect.any(Function), 24)
    })

    it("Goes to the next page", async () => {
        render(<NovelSearch />)

        await user.click(screen.getByRole('button', { name: 'Next Page' }))
        expect(useNovels).toHaveBeenCalledWith("", 2, expect.any(Function), 24)
    })

    it("Goes to a page where there are no more novels to display. (Controlled in useNovel)", async () => {
        render(<NovelSearch />)

        await user.click(screen.getByRole('button', { name: 'Next Page' }))
        await user.click(screen.getByRole('button', { name: 'Next Page' }))
        expect(useNovels).toHaveBeenCalledWith("", 3, expect.any(Function), 24)
    })

    it("Calls useNovels when search term changes", async () => {
        render(<NovelSearch />)

        await user.type(screen.getByRole('textbox'), "mars")
        expect(useNovels).toHaveBeenCalledWith("mars", 1, expect.any(Function), 24)
    })

    it("Allows page change when search term is present", async () => {
        render(<NovelSearch />)

        await user.type(screen.getByRole('textbox'), "mars")
        await user.click(screen.getByRole('button', { name: "Next Page" }))
        expect(useNovels).toHaveBeenCalledWith("mars", 2, expect.any(Function), 24)
    })
})
