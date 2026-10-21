import { cleanup, render, screen } from "@testing-library/react"
import user from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import NovelGrid from "./NovelGrid"
import { type Novel } from "@novelot-types/Novel"

describe("NovelGrid", () => {
    const id = 1
    const title = "Novel 1"
    const author = "Author 1"
    const likes = 24
    const views = 10000
    const description = "Greatest Novel of All Time"
    const tags = [
        "Comedy",
        "Tragedy",
        "Romance"
    ]

    const novel: Novel = { id, title, author, likes, views, description, tags }

    afterEach(() => {
        cleanup()
    })

    it("Renders novelGrid correctly", () => {
        render(
            <MemoryRouter>
                <NovelGrid novel={novel} />
            </MemoryRouter>
        )

        expect(screen.getByText(title)).toBeInTheDocument()
        expect(screen.getByText(author)).toBeInTheDocument()
        expect(screen.getByText(likes, { exact: false })).toBeInTheDocument()
        expect(screen.getByText(views)).toBeInTheDocument()
        expect(screen.getByText(description)).toBeInTheDocument()
        tags.map(tag => {
            expect(screen.getByText(tag)).toBeInTheDocument()
        })
        expect(screen.getByRole('img')).toBeInTheDocument()
        expect(screen.getByRole('img', { name: title + " Thumbnail" })).toBeInTheDocument()
    })

    it("Navigates to the first chapter when clicked anywhere on the grid", async () => {
        render(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<NovelGrid novel={novel} />} />
                    <Route path={`/novels/${id}/chapters/1`} element={<p>Reader</p>} />
                </Routes>
            </MemoryRouter>
        )

        await user.click(screen.getByText(description))

        expect(screen.getByText("Reader")).toBeInTheDocument()
    })
})
