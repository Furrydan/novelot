import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import AuthDropdown from "./AuthDropdown";

vi.mock("./LoginForm", () => ({
    default: () => <div>Login form</div>,
}));

vi.mock("./RegisterForm", () => ({
    default: () => <div>Register form</div>,
}));

describe("AuthDropdown", () => {
    afterEach(cleanup);

    it("shows the login form initially", () => {
        render(<AuthDropdown onClose={vi.fn()} />);

        expect(screen.getByText("Login form")).toBeInTheDocument();
        expect(screen.queryByText("Register form")).not.toBeInTheDocument();
    });

    it("switches between the register and login forms", async () => {
        const user = userEvent.setup();
        render(<AuthDropdown onClose={vi.fn()} />);

        await user.click(screen.getByRole("button", { name: "Register" }));
        expect(screen.getByText("Register form")).toBeInTheDocument();
        expect(screen.queryByText("Login form")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Login" }));
        expect(screen.getByText("Login form")).toBeInTheDocument();
        expect(screen.queryByText("Register form")).not.toBeInTheDocument();
    });

    it("calls onClose when Close is clicked", async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<AuthDropdown onClose={onClose} />);

        await user.click(screen.getByRole("button", { name: "Close" }));

        expect(onClose).toHaveBeenCalledOnce();
    });
});
