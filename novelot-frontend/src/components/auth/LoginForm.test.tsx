import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authApi } from "@api/novelClients";
import { AuthProvider } from "@/context/AuthContext";
import LoginForm from "./LoginForm";

vi.mock("@api/novelClients", () => ({
    authApi: {
        post: vi.fn(),
        defaults: { headers: { common: {} } },
    },
}));

const email = "reader@example.com";
const password = "password123";

function deferredResponse() {
    let resolve!: (response: AxiosResponse) => void;
    const promise = new Promise<AxiosResponse>((done) => {
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

function renderLogin(onSuccess: () => void) {
    const user = userEvent.setup();
    render(
        <AuthProvider>
            <LoginForm onSuccess={onSuccess} />
        </AuthProvider>,
    );
    return user;
}

async function enterCredentials(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByRole("textbox", { name: "Email" }), email);
    await user.type(screen.getByLabelText("Password"), password);
}

describe("LoginForm", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        delete authApi.defaults.headers.common["Authorization"];
    });

    afterEach(cleanup);

    it("submits the entered credentials, clears the form, and calls onSuccess after login", async () => {
        vi.mocked(authApi.post).mockResolvedValueOnce({ data: { accessToken: "token" } } as AxiosResponse);
        const onSuccess = vi.fn();
        const user = renderLogin(onSuccess);

        await enterCredentials(user);
        expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue(email);
        expect(screen.getByLabelText("Password")).toHaveValue(password);
        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(authApi.post).toHaveBeenCalledExactlyOnceWith("/login", { email, password });
        await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
        expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("");
        expect(screen.getByLabelText("Password")).toHaveValue("");
    });

    it("disables the submit button while login is pending and restores it afterward", async () => {
        const response = deferredResponse();
        vi.mocked(authApi.post).mockReturnValueOnce(response.promise);
        const onSuccess = vi.fn();
        const user = renderLogin(onSuccess);

        await enterCredentials(user);
        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(screen.getByRole("button", { name: "Logging in..." })).toBeDisabled();
        expect(onSuccess).not.toHaveBeenCalled();

        await act(async () => {
            response.resolve({ data: { accessToken: "token" } } as AxiosResponse);
        });

        expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
        expect(onSuccess).toHaveBeenCalledOnce();
    });

    it("displays the server's error message without calling onSuccess", async () => {
        vi.mocked(authApi.post).mockRejectedValueOnce(serverError("Invalid credentials"));
        const onSuccess = vi.fn();
        const user = renderLogin(onSuccess);

        await enterCredentials(user);
        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it("displays a fallback message when login fails without a server message", async () => {
        vi.mocked(authApi.post).mockRejectedValueOnce(new Error("Network failed"));
        const onSuccess = vi.fn();
        const user = renderLogin(onSuccess);

        await enterCredentials(user);
        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it("clears a previous error when retrying and succeeds after the retry resolves", async () => {
        const retry = deferredResponse();
        vi.mocked(authApi.post)
            .mockRejectedValueOnce(serverError("Invalid credentials"))
            .mockReturnValueOnce(retry.promise);
        const onSuccess = vi.fn();
        const user = renderLogin(onSuccess);

        await enterCredentials(user);
        await user.click(screen.getByRole("button", { name: "Login" }));
        expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Login" }));
        expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Logging in..." })).toBeDisabled();
        expect(onSuccess).not.toHaveBeenCalled();

        await act(async () => {
            retry.resolve({ data: { accessToken: "token" } } as AxiosResponse);
        });

        expect(authApi.post).toHaveBeenCalledTimes(2);
        expect(onSuccess).toHaveBeenCalledOnce();
    });
});
