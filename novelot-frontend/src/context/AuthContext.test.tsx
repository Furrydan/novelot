import { act, cleanup, renderHook } from "@testing-library/react";
import type { AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authApi } from "@api/novelClients";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("@api/novelClients", () => ({
    authApi: {
        post: vi.fn(),
        get: vi.fn(),
        defaults: { headers: { common: {} } },
    },
}));

const email = "reader@example.com";
const password = "password123";

const meResponse = {
    data: {
        email: email
    }
}

function deferredResponse() {
    let resolve!: (response: AxiosResponse) => void;
    const promise = new Promise<AxiosResponse>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

describe("AuthProvider", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(authApi.post).mockRejectedValueOnce(new Error("Unauthorized"));
        delete authApi.defaults.headers.common["Authorization"];
    });

    afterEach(cleanup);

    it("attempts a refresh on mount and stays logged out when it fails", async () => {
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        await act(async () => {
            await Promise.resolve();
        });

        expect(authApi.post).toHaveBeenCalledExactlyOnceWith("/refresh");
        expect(authApi.get).not.toHaveBeenCalled();
        expect(result.current.user).toBeNull();
        expect(result.current.isLoggedIn).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(authApi.defaults.headers.common["Authorization"]).toBeUndefined();
    });

    it("shows generic user when /me fails", async () => {
        const refreshResponse = deferredResponse();
        vi.mocked(authApi.post).mockReset().mockReturnValueOnce(refreshResponse.promise);
        vi.mocked(authApi.get).mockRejectedValue(new Error("Unauthorized"))
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        expect(authApi.post).toHaveBeenCalledExactlyOnceWith("/refresh");
        expect(result.current.user).toBeNull();
        expect(result.current.isLoggedIn).toBe(false);
        expect(authApi.defaults.headers.common["Authorization"]).toBeUndefined();

        await act(async () => {
            refreshResponse.resolve({ data: { accessToken: "refresh-token" } } as AxiosResponse);
            await refreshResponse.promise;
        });

        expect(authApi.post).toHaveBeenCalledTimes(1);
        expect(authApi.get).toHaveBeenCalledWith("/me")
        expect(result.current.user).toEqual({});
        expect(result.current.isLoggedIn).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(authApi.defaults.headers.common["Authorization"]).toBe("Bearer refresh-token");

    })

    it.each([{ type: "number", val: 50 },
    { type: "boolean", val: true }])(
        "shows generic user when /me returns $type", async ({ val }) => {
            const refreshResponse = deferredResponse();
            const getResponse = {
                data: {
                    email: val
                }
            }
            vi.mocked(authApi.post).mockReset().mockReturnValueOnce(refreshResponse.promise);
            vi.mocked(authApi.get).mockResolvedValueOnce(getResponse)
            const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

            expect(authApi.post).toHaveBeenCalledExactlyOnceWith("/refresh");
            expect(result.current.user).toBeNull();
            expect(result.current.isLoggedIn).toBe(false);
            expect(authApi.defaults.headers.common["Authorization"]).toBeUndefined();

            await act(async () => {
                refreshResponse.resolve({ data: { accessToken: "refresh-token" } } as AxiosResponse);
                await refreshResponse.promise;
            });

            expect(authApi.post).toHaveBeenCalledTimes(1);
            expect(authApi.get).toHaveBeenCalledWith("/me")
            expect(result.current.user).toEqual({});
            expect(result.current.isLoggedIn).toBe(true);
            expect(result.current.isLoading).toBe(false);
            expect(authApi.defaults.headers.common["Authorization"]).toBe("Bearer refresh-token");

        })


    it.each([
        { mode: "normal", reactStrictMode: false },
        { mode: "strict", reactStrictMode: true },
    ])(
        "restores the session with a single refresh on mount in $mode mode",
        async ({ reactStrictMode }) => {
            const refreshResponse = deferredResponse();
            vi.mocked(authApi.post).mockReset().mockReturnValueOnce(refreshResponse.promise);
            vi.mocked(authApi.get).mockResolvedValueOnce(meResponse)
            const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider, reactStrictMode });

            expect(authApi.post).toHaveBeenCalledExactlyOnceWith("/refresh");
            expect(result.current.user).toBeNull();
            expect(result.current.isLoggedIn).toBe(false);
            expect(authApi.defaults.headers.common["Authorization"]).toBeUndefined();

            await act(async () => {
                refreshResponse.resolve({ data: { accessToken: "refresh-token" } } as AxiosResponse);
                await refreshResponse.promise;
            });

            expect(authApi.post).toHaveBeenCalledTimes(1);
            expect(authApi.get).toHaveBeenCalledWith("/me")
            expect(result.current.user).toEqual({ email });
            expect(result.current.isLoggedIn).toBe(true);
            expect(result.current.isLoading).toBe(false);
            expect(authApi.defaults.headers.common["Authorization"]).toBe("Bearer refresh-token");
        },
    );

    it("logs in, exposes the user, and sets the authorization header", async () => {
        const loginResponse = deferredResponse();
        vi.mocked(authApi.post).mockReturnValueOnce(loginResponse.promise);
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        let loginPromise!: Promise<void>;
        act(() => {
            loginPromise = result.current.login(email, password);
        });

        expect(authApi.post).toHaveBeenCalledTimes(2);
        expect(authApi.post).toHaveBeenLastCalledWith("/login", { email, password });
        expect(result.current.isLoading).toBe(true);
        expect(result.current.isLoggedIn).toBe(false);

        await act(async () => {
            loginResponse.resolve({ data: { accessToken: "login-token" } } as AxiosResponse);
            await loginPromise;
        });

        expect(result.current.user).toEqual({ email });
        expect(result.current.isLoggedIn).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(authApi.defaults.headers.common["Authorization"]).toBe("Bearer login-token");
    });

    it("propagates a login error and clears loading without logging in", async () => {
        const error = new Error("Login failed");
        vi.mocked(authApi.post).mockRejectedValueOnce(error);
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        await act(async () => {
            await expect(result.current.login(email, password)).rejects.toBe(error);
        });

        expect(authApi.post).toHaveBeenCalledTimes(2);
        expect(authApi.post).toHaveBeenLastCalledWith("/login", { email, password });
        expect(result.current.user).toBeNull();
        expect(result.current.isLoggedIn).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(authApi.defaults.headers.common["Authorization"]).toBeUndefined();
    });

    it("registers, logs in, and stays loading until login completes", async () => {
        const loginResponse = deferredResponse();
        vi.mocked(authApi.post)
            .mockResolvedValueOnce({ status: 201 } as AxiosResponse)
            .mockReturnValueOnce(loginResponse.promise);
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        let registerPromise!: Promise<void>;
        act(() => {
            registerPromise = result.current.register(email, password);
        });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.user).toBeNull();
        expect(authApi.post).toHaveBeenNthCalledWith(2, "/register", { email, password });

        await act(async () => {
            await Promise.resolve();
        });

        expect(authApi.post).toHaveBeenNthCalledWith(3, "/login", { email, password });
        expect(result.current.isLoading).toBe(true);
        expect(result.current.isLoggedIn).toBe(false);

        await act(async () => {
            loginResponse.resolve({ data: { accessToken: "register-token" } } as AxiosResponse);
            await registerPromise;
        });

        expect(authApi.post).toHaveBeenCalledTimes(3);
        expect(result.current.user).toEqual({ email });
        expect(result.current.isLoggedIn).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(authApi.defaults.headers.common["Authorization"]).toBe("Bearer register-token");
    });

    it.each(["registration", "follow-up login"])(
        "propagates a failed %s and clears loading",
        async (failedStep) => {
            const error = new Error(`${failedStep} failed`);
            if (failedStep === "follow-up login") {
                vi.mocked(authApi.post).mockResolvedValueOnce({ status: 201 } as AxiosResponse);
            }
            vi.mocked(authApi.post).mockRejectedValueOnce(error);
            const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

            await act(async () => {
                await expect(result.current.register(email, password)).rejects.toBe(error);
            });

            expect(authApi.post).toHaveBeenCalledTimes(failedStep === "registration" ? 2 : 3);
            expect(result.current.user).toBeNull();
            expect(result.current.isLoggedIn).toBe(false);
            expect(result.current.isLoading).toBe(false);
            expect(authApi.defaults.headers.common["Authorization"]).toBeUndefined();
        },
    );

    it("rejects without logging in when registration does not return 201", async () => {
        vi.mocked(authApi.post).mockResolvedValueOnce({ status: 200 } as AxiosResponse);
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        await act(async () => {
            await expect(result.current.register(email, password)).rejects.toThrow("Registration failed");
        });

        expect(authApi.post).toHaveBeenCalledTimes(2);
        expect(authApi.post).toHaveBeenLastCalledWith("/register", { email, password });
        expect(result.current.user).toBeNull();
        expect(result.current.isLoggedIn).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(authApi.defaults.headers.common["Authorization"]).toBeUndefined();
    });

    it("requires an AuthProvider to use the context", () => {
        expect(() => renderHook(() => useAuth())).toThrow(
            "useAuth must be used within an AuthProvider",
        );
    });
});
