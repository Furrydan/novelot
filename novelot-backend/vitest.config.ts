import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        coverage: {
            provider: "v8",
            include: ["src/**"],
            exclude: ["src/routes/**",
                "src/models/**",
                "src/index.ts",
                "src/db.ts"]
        }
    }
})
