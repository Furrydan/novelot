import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/context/AuthContext";
import UserMenu from "./UserMenu";

vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));

const loggedOutAuth: ReturnType<typeof useAuth> = {
    user: null,
    isLoggedIn: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
};

describe("UserMenu", () => {
    beforeEach(() => {
        vi.mocked(useAuth).mockReturnValue(loggedOutAuth);
    });

    afterEach(() => {
        cleanup();
        vi.resetAllMocks();
    });

    it("shows Login / Register without a dropdown when logged out", () => {
        render(<UserMenu />);

        expect(screen.getByRole("button", { name: "Login / Register" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });

    it("opens the auth dropdown and closes it with either the trigger or Close button", async () => {
        const user = userEvent.setup();
        render(<UserMenu />);
        const trigger = screen.getByRole("button", { name: "Login / Register" });

        await user.click(trigger);
        expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
        expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();

        await user.click(trigger);
        expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();

        await user.click(trigger);
        await user.click(screen.getByRole("button", { name: "Close" }));
        expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });

    it("shows the user's email instead of a login button when logged in", () => {
        const email = "reader@example.com";
        vi.mocked(useAuth).mockReturnValue({
            ...loggedOutAuth,
            user: { email },
            isLoggedIn: true,
        });

        render(<UserMenu />);

        expect(screen.getByText(email)).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Login / Register" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });
});
