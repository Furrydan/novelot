import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "./LoginForm";

vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));

const email = "reader@example.com";
const password = "password123";
const login = vi.fn<(email: string, password: string) => Promise<void>>();
const auth: ReturnType<typeof useAuth> = {
    user: null,
    isLoggedIn: false,
    isLoading: false,
    login,
    register: vi.fn(),
};

function deferredLogin() {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

function serverError(message: string) {
    return new AxiosError("Login failed", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 401,
        data: { message },
    } as AxiosResponse);
}

async function enterCredentials(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByRole("textbox", { name: "Email" }), email);
    await user.type(screen.getByLabelText("Password"), password);
}

describe("LoginForm", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        login.mockResolvedValue(undefined);
        auth.isLoading = false;
        vi.mocked(useAuth).mockReturnValue(auth);
    });

    afterEach(cleanup);

    it("submits the entered credentials, clears the form, and calls onSuccess after login", async () => {
        const pending = deferredLogin();
        login.mockReturnValueOnce(pending.promise);
        const onSuccess = vi.fn();
        const user = userEvent.setup();
        render(<LoginForm onSuccess={onSuccess} />);

        await enterCredentials(user);
        expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue(email);
        expect(screen.getByLabelText("Password")).toHaveValue(password);
        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(login).toHaveBeenCalledExactlyOnceWith(email, password);
        expect(onSuccess).not.toHaveBeenCalled();
        await act(async () => pending.resolve());

        expect(onSuccess).toHaveBeenCalledOnce();
        expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("");
        expect(screen.getByLabelText("Password")).toHaveValue("");
    });

    it("shows the loading label and disables submission when auth is loading", async () => {
        const onSuccess = vi.fn();
        const { rerender } = render(<LoginForm onSuccess={onSuccess} />);

        expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
        auth.isLoading = true;
        rerender(<LoginForm onSuccess={onSuccess} />);
        expect(screen.getByRole("button", { name: "Logging in..." })).toBeDisabled();

        auth.isLoading = false;
        rerender(<LoginForm onSuccess={onSuccess} />);
        expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
    });

    it("displays the server's error message without calling onSuccess", async () => {
        login.mockRejectedValueOnce(serverError("Invalid credentials"));
        const onSuccess = vi.fn();
        const user = userEvent.setup();
        render(<LoginForm onSuccess={onSuccess} />);

        await enterCredentials(user);
        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it("displays a fallback message when login fails without a server message", async () => {
        login.mockRejectedValueOnce(new Error("Network failed"));
        const onSuccess = vi.fn();
        const user = userEvent.setup();
        render(<LoginForm onSuccess={onSuccess} />);

        await enterCredentials(user);
        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it("clears a previous error when retrying and succeeds after the retry resolves", async () => {
        const retry = deferredLogin();
        login.mockRejectedValueOnce(serverError("Invalid credentials")).mockReturnValueOnce(retry.promise);
        const onSuccess = vi.fn();
        const user = userEvent.setup();
        render(<LoginForm onSuccess={onSuccess} />);

        await enterCredentials(user);
        await user.click(screen.getByRole("button", { name: "Login" }));
        expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Login" }));
        expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
        expect(onSuccess).not.toHaveBeenCalled();

        await act(async () => retry.resolve());

        expect(login).toHaveBeenCalledTimes(2);
        await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    });
});
