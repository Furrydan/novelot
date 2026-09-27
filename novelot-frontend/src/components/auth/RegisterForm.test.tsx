import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/context/AuthContext";
import RegisterForm from "./RegisterForm";

vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));

const email = "reader@example.com";
const password = "password123";
const register = vi.fn<(email: string, password: string) => Promise<void>>();
const auth: ReturnType<typeof useAuth> = {
    user: null,
    isLoggedIn: false,
    isLoading: false,
    login: vi.fn(),
    register,
};

function deferredRegistration() {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

function serverError(message: string) {
    return new AxiosError("Registration failed", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400,
        data: { message },
    } as AxiosResponse);
}

async function enterCredentials(user: ReturnType<typeof userEvent.setup>, confirmation = password) {
    await user.type(screen.getByRole("textbox", { name: "Email" }), email);
    await user.type(screen.getByLabelText("Password", { exact: true }), password);
    await user.type(screen.getByLabelText("Confirm Password"), confirmation);
}

describe("RegisterForm", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        register.mockResolvedValue(undefined);
        auth.isLoading = false;
        vi.mocked(useAuth).mockReturnValue(auth);
    });

    afterEach(cleanup);

    it("passes the entered credentials to register, then clears the fields and calls onSuccess", async () => {
        const pending = deferredRegistration();
        register.mockReturnValueOnce(pending.promise);
        const onSuccess = vi.fn();
        const user = userEvent.setup();
        render(<RegisterForm onSuccess={onSuccess} />);

        await enterCredentials(user);
        expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue(email);
        expect(screen.getByLabelText("Password", { exact: true })).toHaveValue(password);
        expect(screen.getByLabelText("Confirm Password")).toHaveValue(password);
        await user.click(screen.getByRole("button", { name: "Register" }));

        expect(register).toHaveBeenCalledExactlyOnceWith(email, password);
        expect(onSuccess).not.toHaveBeenCalled();
        await act(async () => pending.resolve());

        expect(onSuccess).toHaveBeenCalledOnce();
        expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("");
        expect(screen.getByLabelText("Password", { exact: true })).toHaveValue("");
        expect(screen.getByLabelText("Confirm Password")).toHaveValue("");
    });

    it("shows a password mismatch without calling register", async () => {
        const onSuccess = vi.fn();
        const user = userEvent.setup();
        render(<RegisterForm onSuccess={onSuccess} />);

        await enterCredentials(user, "different-password");
        await user.click(screen.getByRole("button", { name: "Register" }));

        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
        expect(register).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it("shows the loading label and disables submission when auth is loading", () => {
        const onSuccess = vi.fn();
        const { rerender } = render(<RegisterForm onSuccess={onSuccess} />);

        expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
        auth.isLoading = true;
        rerender(<RegisterForm onSuccess={onSuccess} />);
        expect(screen.getByRole("button", { name: "Creating account..." })).toBeDisabled();

        auth.isLoading = false;
        rerender(<RegisterForm onSuccess={onSuccess} />);
        expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
    });

    it("shows a server error without calling onSuccess", async () => {
        register.mockRejectedValueOnce(serverError("Could not create account"));
        const onSuccess = vi.fn();
        const user = userEvent.setup();
        render(<RegisterForm onSuccess={onSuccess} />);

        await enterCredentials(user);
        await user.click(screen.getByRole("button", { name: "Register" }));

        expect(await screen.findByText("Could not create account")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
        expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue(email);
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it("shows a fallback message when register fails without a server message", async () => {
        register.mockRejectedValueOnce(new Error("Registration failed"));
        const onSuccess = vi.fn();
        const user = userEvent.setup();
        render(<RegisterForm onSuccess={onSuccess} />);

        await enterCredentials(user);
        await user.click(screen.getByRole("button", { name: "Register" }));

        expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it("clears an earlier error when retrying", async () => {
        const retry = deferredRegistration();
        register.mockRejectedValueOnce(serverError("Could not create account")).mockReturnValueOnce(retry.promise);
        const onSuccess = vi.fn();
        const user = userEvent.setup();
        render(<RegisterForm onSuccess={onSuccess} />);

        await enterCredentials(user);
        await user.click(screen.getByRole("button", { name: "Register" }));
        expect(await screen.findByText("Could not create account")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Register" }));
        expect(screen.queryByText("Could not create account")).not.toBeInTheDocument();
        expect(onSuccess).not.toHaveBeenCalled();

        await act(async () => retry.resolve());

        expect(register).toHaveBeenCalledTimes(2);
        expect(onSuccess).toHaveBeenCalledOnce();
    });
});
