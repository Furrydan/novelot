import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authApi } from "@api/novelClients";
import { AuthProvider } from "@/context/AuthContext";
import RegisterForm from "./RegisterForm";

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
    return new AxiosError("Registration failed", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400,
        data: { message },
    } as AxiosResponse);
}

function renderRegister(onSuccess: () => void) {
    const user = userEvent.setup();
    render(
        <AuthProvider>
            <RegisterForm onSuccess={onSuccess} />
        </AuthProvider>,
    );
    return user;
}

async function enterCredentials(user: ReturnType<typeof userEvent.setup>, confirmation = password) {
    await user.type(screen.getByRole("textbox", { name: "Email" }), email);
    await user.type(screen.getByLabelText("Password", { exact: true }), password);
    await user.type(screen.getByLabelText("Confirm Password"), confirmation);
}

describe("RegisterForm", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        delete authApi.defaults.headers.common["Authorization"];
    });

    afterEach(cleanup);

    it("registers, logs in, clears the fields, and calls onSuccess", async () => {
        vi.mocked(authApi.post)
            .mockResolvedValueOnce({ status: 201 } as AxiosResponse)
            .mockResolvedValueOnce({ data: { accessToken: "token" } } as AxiosResponse);
        const onSuccess = vi.fn();
        const user = renderRegister(onSuccess);

        await enterCredentials(user);
        expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue(email);
        expect(screen.getByLabelText("Password", { exact: true })).toHaveValue(password);
        expect(screen.getByLabelText("Confirm Password")).toHaveValue(password);
        await user.click(screen.getByRole("button", { name: "Register" }));

        await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
        expect(authApi.post).toHaveBeenNthCalledWith(1, "/register", { email, password });
        expect(authApi.post).toHaveBeenNthCalledWith(2, "/login", { email, password });
        expect(authApi.post).toHaveBeenCalledTimes(2);
        expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("");
        expect(screen.getByLabelText("Password", { exact: true })).toHaveValue("");
        expect(screen.getByLabelText("Confirm Password")).toHaveValue("");
    });

    it("shows a password mismatch without making a request", async () => {
        const onSuccess = vi.fn();
        const user = renderRegister(onSuccess);

        await enterCredentials(user, "different-password");
        await user.click(screen.getByRole("button", { name: "Register" }));

        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
        expect(authApi.post).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it("stays disabled through registration and follow-up login", async () => {
        const registration = deferredResponse();
        const login = deferredResponse();
        vi.mocked(authApi.post)
            .mockReturnValueOnce(registration.promise)
            .mockReturnValueOnce(login.promise);
        const onSuccess = vi.fn();
        const user = renderRegister(onSuccess);

        await enterCredentials(user);
        await user.click(screen.getByRole("button", { name: "Register" }));
        expect(screen.getByRole("button", { name: "Creating account..." })).toBeDisabled();
        expect(onSuccess).not.toHaveBeenCalled();

        await act(async () => {
            registration.resolve({ status: 201 } as AxiosResponse);
        });
        expect(authApi.post).toHaveBeenNthCalledWith(2, "/login", { email, password });
        expect(screen.getByRole("button", { name: "Creating account..." })).toBeDisabled();
        expect(onSuccess).not.toHaveBeenCalled();

        await act(async () => {
            login.resolve({ data: { accessToken: "token" } } as AxiosResponse);
        });
        expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
        expect(onSuccess).toHaveBeenCalledOnce();
    });

    it.each(["registration", "follow-up login"])(
        "shows a server error when %s fails without closing the form",
        async (failedStep) => {
            if (failedStep === "follow-up login") {
                vi.mocked(authApi.post).mockResolvedValueOnce({ status: 201 } as AxiosResponse);
            }
            vi.mocked(authApi.post).mockRejectedValueOnce(serverError("Could not create account"));
            const onSuccess = vi.fn();
            const user = renderRegister(onSuccess);

            await enterCredentials(user);
            await user.click(screen.getByRole("button", { name: "Register" }));

            expect(await screen.findByText("Could not create account")).toBeInTheDocument();
            expect(authApi.post).toHaveBeenCalledTimes(failedStep === "registration" ? 1 : 2);
            expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
            expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue(email);
            expect(onSuccess).not.toHaveBeenCalled();
        },
    );

    it("shows a fallback message for an unexpected error", async () => {
        vi.mocked(authApi.post).mockRejectedValueOnce(new Error("Network failed"));
        const onSuccess = vi.fn();
        const user = renderRegister(onSuccess);

        await enterCredentials(user);
        await user.click(screen.getByRole("button", { name: "Register" }));

        expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it("clears an earlier error when retrying", async () => {
        const retry = deferredResponse();
        vi.mocked(authApi.post)
            .mockRejectedValueOnce(serverError("Could not create account"))
            .mockReturnValueOnce(retry.promise)
            .mockResolvedValueOnce({ data: { accessToken: "token" } } as AxiosResponse);
        const onSuccess = vi.fn();
        const user = renderRegister(onSuccess);

        await enterCredentials(user);
        await user.click(screen.getByRole("button", { name: "Register" }));
        expect(await screen.findByText("Could not create account")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Register" }));
        expect(screen.queryByText("Could not create account")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Creating account..." })).toBeDisabled();
        expect(onSuccess).not.toHaveBeenCalled();

        await act(async () => {
            retry.resolve({ status: 201 } as AxiosResponse);
        });

        await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
        expect(authApi.post).toHaveBeenCalledTimes(3);
    });

    it("does not report success for a non-201 registration response", async () => {
        vi.mocked(authApi.post).mockResolvedValueOnce({ status: 200 } as AxiosResponse);
        const onSuccess = vi.fn();
        const user = renderRegister(onSuccess);

        await enterCredentials(user);
        await user.click(screen.getByRole("button", { name: "Register" }));

        expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
        expect(authApi.post).toHaveBeenCalledExactlyOnceWith("/register", { email, password });
        expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
        expect(onSuccess).not.toHaveBeenCalled();
    });
});
