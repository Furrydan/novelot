import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/context/AuthContext";
import AccountDropdown from "./AccountDropdown";

vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));

const logout = vi.fn<() => Promise<void>>();
const auth: ReturnType<typeof useAuth> = {
    user: { email: "reader@example.com" },
    isLoggedIn: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout,
};

describe("AccountDropdown", () => {
    beforeEach(() => {
        logout.mockReset().mockResolvedValue();
        vi.mocked(useAuth).mockReturnValue(auth);
    });

    afterEach(cleanup);

    it("shows the email, menu items and Logout", () => {
        render(<AccountDropdown onClose={vi.fn()} />);

        expect(screen.getByText("reader@example.com")).toBeInTheDocument();
        for (const name of ["Profile", "Reading History", "Logout"]) {
            expect(screen.getByRole("button", { name })).toBeInTheDocument();
        }
    });

    it("calls onClose when Close is clicked", async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<AccountDropdown onClose={onClose} />);

        await user.click(screen.getByRole("button", { name: "Close" }));

        expect(onClose).toHaveBeenCalledOnce();
    });

    it.each(["Profile", "Reading History"])(
        "calls onClose when %s is clicked",
        async (name) => {
            const onClose = vi.fn();
            const user = userEvent.setup();
            render(<AccountDropdown onClose={onClose} />);

            await user.click(screen.getByRole("button", { name }));

            expect(onClose).toHaveBeenCalledOnce();
        },
    );

    it("logs out and closes when Logout is clicked", async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<AccountDropdown onClose={onClose} />);

        await user.click(screen.getByRole("button", { name: "Logout" }));

        expect(logout).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("still closes when logout fails", async () => {
        logout.mockRejectedValue(new Error("Network Error"));
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<AccountDropdown onClose={onClose} />);

        await user.click(screen.getByRole("button", { name: "Logout" }));

        expect(onClose).toHaveBeenCalledOnce();
    });

    it("disables Logout while loading", () => {
        vi.mocked(useAuth).mockReturnValue({ ...auth, isLoading: true });
        render(<AccountDropdown onClose={vi.fn()} />);

        expect(
            screen.getByRole("button", { name: "Logging Out..." }),
        ).toBeDisabled();
    });
});
