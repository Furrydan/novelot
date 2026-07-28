import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import NovelGrid from "./NovelGrid"
import { type Novel } from "@novelot-types/Types"

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

    it("Renders novelGrid correctly", () => {
        render(<NovelGrid novel={novel} />)

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
})
