import '@testing-library/jest-dom/vitest'
import { beforeAll, afterAll, vi } from 'vitest'

beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
    vi.restoreAllMocks()
})
