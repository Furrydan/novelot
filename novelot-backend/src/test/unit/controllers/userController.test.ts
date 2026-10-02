import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response, Request } from "express";
import userController from "@controllers/userController.js";
import userService from "@services/userService.js";
import { sendAccessToken, sendRefreshToken } from "@helpers/token.ts";
import { validateEmail, validatePassword } from "@helpers/validator.ts";
import { novelotError } from "@helpers/error.js";
import { cookies } from "supertest";

vi.mock("@services/userService.ts", () => ({
  default: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    refreshUser: vi.fn(),
    getUserEmailFromAccessToken: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

vi.mock("@helpers/token.ts", () => ({
  sendAccessToken: vi.fn(),
  sendRefreshToken: vi.fn(),
}));

vi.mock("@helpers/validator.ts", () => ({
  validateEmail: vi.fn(),
  validatePassword: vi.fn(),
}));

describe("#login", () => {
  let req: Request;
  let res: Response;
  const accessToken = "TestAToken";
  const refreshToken = "TestRToken";

  vi.mocked(userService.loginUser).mockResolvedValue({
    accessToken,
    refreshToken,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {
        email: "TestEmail",
        password: "TestPassword",
      },
    } as unknown as Request;

    res = {} as unknown as Response;
  });

  it("Validates email and password, calls userService and sends tokens", async () => {
    await userController.login(req, res);
    expect(validateEmail).toHaveBeenCalledExactlyOnceWith(req.body.email);

    expect(validatePassword).toHaveBeenCalledExactlyOnceWith(req.body.password);

    expect(userService.loginUser).toHaveBeenCalledExactlyOnceWith(
      req.body.email,
      req.body.password,
    );

    expect(sendAccessToken).toHaveBeenCalledExactlyOnceWith(accessToken, res);

    expect(sendRefreshToken).toHaveBeenCalledExactlyOnceWith(refreshToken, res);
  });
});

describe("#register", () => {
  let req: Request;
  let res: Response;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {
        email: "TestEmail",
        password: "TestPassword",
      },
    } as unknown as Request;

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
  });

  it("Validates email and password, calls userService and sends positive response", async () => {
    await userController.register(req, res);

    expect(validateEmail).toHaveBeenCalledExactlyOnceWith(req.body.email);

    expect(validatePassword).toHaveBeenCalledExactlyOnceWith(req.body.password);

    expect(userService.registerUser).toHaveBeenCalledExactlyOnceWith(
      req.body.email,
      req.body.password,
    );

    expect(res.status).toHaveBeenCalledExactlyOnceWith(201);

    expect(res.json).toHaveBeenCalledExactlyOnceWith({
      message: "User Created",
    });
  });
});

describe("#refresh", () => {
  let req: Request;
  let res: Response;
  const email = "harry@gmail.com";
  const oldRefreshToken = "old-refresh-token";
  const accessToken = "new-access-token";
  const refreshToken = "new-refresh-token";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.refreshUser).mockReset();
    vi.mocked(userService.refreshUser).mockResolvedValue({
      accessToken,
      refreshToken,
    });
    req = {
      body: { email },
      cookies: { refreshToken: oldRefreshToken },
    } as unknown as Request;
    res = {} as unknown as Response;
  });

  it("Passes only the cookie to the service and sends the returned tokens", async () => {
    await userController.refresh(req, res);

    expect(userService.refreshUser).toHaveBeenCalledExactlyOnceWith(
      oldRefreshToken,
    );
    expect(sendAccessToken).toHaveBeenCalledExactlyOnceWith(accessToken, res);
    expect(sendRefreshToken).toHaveBeenCalledExactlyOnceWith(refreshToken, res);
  });

  it("Throws 401 when the refresh cookie is missing", async () => {
    req.cookies = {};

    await expect(userController.refresh(req, res)).rejects.toMatchObject({
      status: 401,
    });

    expect(userService.refreshUser).not.toHaveBeenCalled();
    expect(sendAccessToken).not.toHaveBeenCalled();
    expect(sendRefreshToken).not.toHaveBeenCalled();
  });

  it.each([
    { reason: "email is missing", body: {} },
    { reason: "request body is missing", body: undefined },
  ])("Refreshes successfully when $reason", async ({ body }) => {
    req.body = body;

    await userController.refresh(req, res);

    expect(userService.refreshUser).toHaveBeenCalledExactlyOnceWith(
      oldRefreshToken,
    );
    expect(sendAccessToken).toHaveBeenCalledExactlyOnceWith(accessToken, res);
    expect(sendRefreshToken).toHaveBeenCalledExactlyOnceWith(refreshToken, res);
  });

  it("Propagates service failures without sending tokens", async () => {
    const error = new novelotError(401, "Unauthorized");
    vi.mocked(userService.refreshUser).mockRejectedValue(error);

    await expect(userController.refresh(req, res)).rejects.toBe(error);

    expect(userService.refreshUser).toHaveBeenCalledExactlyOnceWith(
      oldRefreshToken,
    );
    expect(sendAccessToken).not.toHaveBeenCalled();
    expect(sendRefreshToken).not.toHaveBeenCalled();
  });
});

describe("#me", () => {
  let req: Request;
  let res: Response;
  const token = "Bearer myToken";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.getUserEmailFromAccessToken).mockReset();
    req = {
      headers: {
        authorization: token,
      },
    } as unknown as Request;
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
  });

  it.each([
    { reason: "missing", headers: {} },
    { reason: "empty", headers: { authorization: "" } },
  ])("Throws 401 when authorization header is $reason", async ({ headers }) => {
    req.headers = headers;
    const error = new novelotError(401, "Unauthorized");

    await expect(userController.getMe(req, res)).rejects.toMatchObject(error);
    expect(userService.getUserEmailFromAccessToken).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("Calls service when accessToken exists and send email", async () => {
    const email = "myEmail";
    vi.mocked(userService.getUserEmailFromAccessToken).mockResolvedValueOnce(
      email,
    );

    await userController.getMe(req, res);
    expect(
      userService.getUserEmailFromAccessToken,
    ).toHaveBeenCalledExactlyOnceWith(token);
    expect(res.status).toHaveBeenCalledExactlyOnceWith(200);
    expect(res.json).toHaveBeenCalledExactlyOnceWith({ email: email });
  });

  it("Propagates service error without sending response", async () => {
    const error = new novelotError(401, "Unauthorized");
    vi.mocked(userService.getUserEmailFromAccessToken).mockRejectedValue(error);

    await expect(userController.getMe(req, res)).rejects.toMatchObject(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe("#logout", () => {
  let refreshToken = "refresh-token";
  let req: Request;
  let res: Response;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.logoutUser).mockReset();
    req = { cookies: { refreshToken } } as unknown as Request;
    res = {
      status: vi.fn(),
    } as unknown as Response;
  });

  it("Returns 200 with message when successful logout", async () => {
    vi.mocked(userService.logoutUser).mockResolvedValue();

    await userController.logout(req, res);

    expect(userService.logoutUser).toHaveBeenCalledExactlyOnceWith(
      refreshToken,
    );
    expect(res.status).toHaveBeenCalledExactlyOnceWith(204);
  });

  it("Throws 401 error when no refresh token is present", async () => {
    req = { cookies: {} } as unknown as Request;
    vi.mocked(userService.logoutUser);
    const error = new novelotError(401, "Unauthorized");

    await expect(userController.logout(req, res)).rejects.toMatchObject(error);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("Propagates service errors without sending response", async () => {
    const error = new Error("Some Error");
    vi.mocked(userService.logoutUser).mockRejectedValue(error);

    await expect(userController.logout(req, res)).rejects.toMatchObject(error);

    expect(res.status).not.toHaveBeenCalled();
  });
});
