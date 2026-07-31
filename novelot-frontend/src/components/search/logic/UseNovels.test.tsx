import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import useNovels from "./UseNovels";
import { api } from "@api/novelClients";
import { isNovel } from "@novelot-types/Novel";
import novelList from "@assets/novelList.json" with {type: 'json'}

vi.mock("@api/novelClients", () => ({
    api: {
        get: vi.fn()
    }
}))

const novels = novelList.filter(isNovel).slice(100, 200)

describe("useNovels /all", () => {

    afterEach(() => {
        vi.clearAllMocks()
    })

    it("Calls all novels when search is empty", async () => {
        const page1 = novels.slice(0, 10)
        vi.mocked(api.get).mockResolvedValue({ data: page1 })
        const setCurrentPage = vi.fn()
        const search = ""
        const currentPage = 1
        const limit = 10

        const { result } = renderHook(
            () => useNovels(search, currentPage, setCurrentPage, limit), { initialProps: { search, currentPage, limit } }
        )

        await waitFor(() => {
            expect(result.current).toEqual(page1)
        })

        expect(api.get).toHaveBeenLastCalledWith("/all", { params: { page: currentPage, limit } })
        expect(setCurrentPage).not.toHaveBeenCalled()
    })

    it("Sends request with new page", async () => {
        const page1 = novels.slice(0, 10)
        vi.mocked(api.get).mockResolvedValueOnce({ data: page1 })
        const setCurrentPage = vi.fn()
        const search = ""
        let currentPage = 1
        const limit = 10

        const { result, rerender } = renderHook(
            ({ search, currentPage, limit }) => useNovels(search, currentPage, setCurrentPage, limit), { initialProps: { search, currentPage, limit } }
        )
        const page2 = novels.slice(11, 20)
        vi.mocked(api.get).mockResolvedValueOnce({ data: page2 })

        currentPage = 2

        rerender({ search, currentPage, limit })

        await waitFor(() => {
            expect(result.current).toEqual(page2)
        })

        expect(api.get).toHaveBeenLastCalledWith("/all", { params: { page: currentPage, limit } })
        expect(setCurrentPage).not.toHaveBeenCalled()

    })

    it("Reverts Page when 400 Error is returned", async () => {
        const page1 = novels.slice(0, 10)
        vi.mocked(api.get).mockResolvedValueOnce({ data: page1 })
        const setCurrentPage = vi.fn()
        const search = ""
        let currentPage = 1
        const limit = 10

        const { rerender } = renderHook(
            ({ search, currentPage, limit }) => useNovels(search, currentPage, setCurrentPage, limit), { initialProps: { search, currentPage, limit } }
        )

        vi.mocked(api.get).mockRejectedValueOnce({
            response: {
                status: 400,
                data: {
                    message: "Invalid Page"
                }
            }
        })
        currentPage = 3
        rerender({ search, currentPage, limit })

        await waitFor(() => {
            expect(setCurrentPage).toHaveBeenCalledOnce()
            const updater = setCurrentPage.mock.calls[0][0]

            expect(updater(5)).toBe(4)
        })
    })

    it("Throws error and returns empty list upon error", async () => {

        const error = {
            response: {
                status: 500,
                data: {
                    message: "Internal Server Error"
                }
            }
        }

        vi.mocked(api.get).mockRejectedValueOnce(error)

        const consoleMock = vi.spyOn(console, 'error')
        const search = ""
        const currentPage = 1
        const setCurrentPage = vi.fn()
        const limit = 1

        const { result } = renderHook(
            ({ search, currentPage, limit }) => useNovels(search, currentPage, setCurrentPage, limit), { initialProps: { search, currentPage, limit } }
        )

        await waitFor(() => {
            expect(result.current).toEqual([])
            expect(consoleMock).toHaveBeenCalled()
            expect(consoleMock).toHaveBeenCalledWith("Failed to load novels", error)
        })

    })

    it("Filters for Novels", async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: ["hello", "testing"] })
        const setCurrentPage = vi.fn()
        const search = ""
        const currentPage = 1
        const limit = 10

        const { result } = renderHook(
            () => useNovels(search, currentPage, setCurrentPage, limit), { initialProps: { search, currentPage, limit } }
        )

        await waitFor(() => {
            expect(result.current).toEqual([])
        })
    })

    it("Filters for array", async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: "hello" })
        const setCurrentPage = vi.fn()
        const search = ""
        const currentPage = 1
        const limit = 10

        const { result } = renderHook(
            () => useNovels(search, currentPage, setCurrentPage, limit), { initialProps: { search, currentPage, limit } }
        )

        await waitFor(() => {
            expect(result.current).toEqual([])
        })

    })
})

describe("UseNovels /search", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.resetAllMocks()
    })

    it("Waits 1 second before sending requests", async () => {
        let search = ""
        const currentPage = 1
        const setCurrentPage = vi.fn()
        const limit = 10
        const page1 = novels.slice(0, 9)
        const page2 = novels.slice(10, 19)

        vi.mocked(api.get).mockResolvedValueOnce({ data: page1 })

        const { result, rerender } = renderHook(
            ({ search }) => useNovels(search, currentPage, setCurrentPage, limit), { initialProps: { search } }
        )

        await vi.waitFor(() => {
            expect(result.current).toEqual(page1)
            expect(api.get).toHaveBeenCalledOnce()
            expect(api.get).toHaveBeenCalledWith("/all", { params: { page: currentPage, limit } })
        })

        vi.clearAllMocks()
        vi.mocked(api.get).mockResolvedValueOnce({ data: page2 })

        search = "test"

        rerender({ search })

        expect(api.get).not.toHaveBeenCalled()

        vi.advanceTimersByTime(999)

        expect(api.get).not.toHaveBeenCalled()
        expect(result.current).toEqual(page1)

        vi.advanceTimersByTime(1)

        await vi.waitFor(() => {
            expect(result.current).toEqual(page2)
        })
        expect(api.get).toHaveBeenCalledOnce()
        expect(api.get).toHaveBeenCalledWith("/search/", { params: { search, page: currentPage, limit } })
    })


    it("No wait when changing page", async () => {
        const search = "hell"
        let currentPage = 1
        const setCurrentPage = vi.fn()
        const limit = 10

        const page1 = novels.slice(0, 9)
        const page2 = novels.slice(10, 19)

        vi.mocked(api.get).mockResolvedValueOnce({ data: page1 })

        const { result, rerender } = renderHook(
            ({ search, currentPage }) => useNovels(search, currentPage, setCurrentPage, limit), { initialProps: { search, currentPage } }
        )

        await vi.waitFor(() => {
            expect(result.current).toEqual(page1)
        })


        vi.clearAllMocks()
        vi.mocked(api.get).mockResolvedValueOnce({ data: page2 })

        currentPage++

        rerender({ search, currentPage })

        expect(api.get).toHaveBeenCalledOnce()
        expect(api.get).toHaveBeenCalledWith("/search/", { params: { search, page: currentPage, limit } })
        await vi.waitFor(() => {
            expect(result.current).toEqual(page2)
        })

    })

    it("Resets timer upon new search", async () => {
        let search = "hell"
        const currentPage = 1
        const setCurrentPage = vi.fn()
        const limit = 10

        const page1 = novels.slice(10, 20)

        vi.mocked(api.get).mockResolvedValue({ data: page1 })

        const { result, rerender } = renderHook(
            ({ search }) => useNovels(search, currentPage, setCurrentPage, limit), { initialProps: { search } }
        )

        expect(api.get).not.toHaveBeenCalledTimes(2)
        expect(result.current).toEqual([])
        vi.advanceTimersByTime(999)
        expect(api.get).not.toHaveBeenCalledTimes(2)
        expect(result.current).toEqual([])

        search = "hello"
        rerender({ search })

        expect(api.get).not.toHaveBeenCalledTimes(2)
        expect(result.current).toEqual([])
        vi.advanceTimersByTime(1)
        expect(api.get).not.toHaveBeenCalledTimes(2)
        expect(result.current).toEqual([])
        vi.advanceTimersByTime(999)
        expect(api.get).toHaveBeenCalledTimes(2)
        await vi.waitFor(() => {
            expect(result.current).toEqual(page1)
        })

    })

})
