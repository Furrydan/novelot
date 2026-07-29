import { render, screen } from '@testing-library/react'
import { describe, it, expect } from "vitest"
import Tag from "./Tag"

describe("Tag", () => {
    it("Renders appropriate tag", () => {
        const tag = "Comedy"
        render(<Tag tag={tag} />)
        const element = screen.getByText(tag)
        expect(element).toBeInTheDocument()
    })
})

