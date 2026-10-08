import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userService from "@services/userService.js";
import userModel from "@models/userModel.js";
import { novelotError } from "@helpers/error.js";
import { hash, compare } from "bcryptjs";
import mongoose from "mongoose";
import { User } from "@apptypes/User.ts";
import jwt from "jsonwebtoken";
import * as tokenHelpers from "@helpers/token.js";

const email = "harry@gmail.com";
const password = "password123";
const user = {
  _id: new mongoose.Types.ObjectId(),
  email: email,
  password: await hash(password, 10),
  refreshToken: "",
} as unknown as User;
const accessTokenKey = "test1";
const refreshTokenKey = "test2";

vi.mock("@models/userModel.js", () => ({
  default: {
    checkEmailExists: vi.fn(),
    addNewUser: vi.fn(),
    getUser: vi.fn(),
    getByID: vi.fn(),
    addRefreshToken: vi.fn(),
    dropRefreshToken: vi.fn(),
  },
}));

beforeEach(() => {
  vi.stubEnv("ACCESS_TOKEN_SECRET", accessTokenKey);
  vi.stubEnv("REFRESH_TOKEN_SECRET", refreshTokenKey);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

describe("# Register User", () => {
  it("Throws 409 if user already exists", async () => {
    vi.mocked(userModel.checkEmailExists).mockResolvedValue(true);

    await expect(userService.registerUser(email, password)).rejects.toThrow(
      new novelotError(409, "User already exists"),
    );
    expect(userModel.addNewUser).not.toHaveBeenCalled();
  });

  it("Hashes the password before storing the user", async () => {
    vi.mocked(userModel.checkEmailExists).mockResolvedValue(false);

    await userService.registerUser(email, password);

    expect(userModel.checkEmailExists).toHaveBeenCalledOnce();
    expect(userModel.checkEmailExists).toHaveBeenCalledWith(email);
    expect(userModel.addNewUser).toHaveBeenCalledOnce();
    const [, storedPassword] = vi.mocked(userModel.addNewUser).mock.calls[0];
    expect(await compare(password, storedPassword)).toBe(true);
  });
});

describe("# Login User", () => {
  it("Throws 401 when user is not found", async () => {
    vi.mocked(userModel.getUser).mockRejectedValue(
      new novelotError(404, "Failed"),
    );
    vi.mocked(userModel.addRefreshToken).mockResolvedValue(true);

    await expect(userService.loginUser(email, password)).rejects.toMatchObject({
      status: 401,
      message: "Email or Password is incorrect",
    });
    await expect(userService.loginUser(email, password)).rejects.toBeInstanceOf(
      novelotError,
    );
    expect(userModel.addRefreshToken).not.toHaveBeenCalled();
  });

  it("Returns Token upon being called", async () => {
    vi.mocked(userModel.getUser).mockResolvedValue(user);

    const { accessToken, refreshToken } = await userService.loginUser(
      email,
      password,
    );

    expect(userModel.getUser).toHaveBeenCalledOnce();
    expect(userModel.getUser).toHaveBeenCalledWith(email);

    const decoded = jwt.verify(accessToken, accessTokenKey) as jwt.JwtPayload;
    expect(decoded.userID).toBe(user._id.toString());
    expect(userModel.addRefreshToken).toHaveBeenCalledOnce();
    const [storedEmail, storedToken] = vi.mocked(userModel.addRefreshToken).mock
      .calls[0];
    expect(storedEmail).toBe(email);
    expect(storedToken).not.toBe(refreshToken);
    expect(storedToken).toBe(tokenHelpers.hashRefreshToken(refreshToken));
  });

  it("Throws 401 if password is incorrect", async () => {
    vi.mocked(userModel.getUser).mockResolvedValue(user);
    vi.mocked(userModel.addRefreshToken).mockResolvedValue(true);

    await expect(userService.loginUser(email, "wrongPassword")).rejects.toThrow(
      new novelotError(401, "Email or Password is incorrect"),
    );
    expect(userModel.addRefreshToken).not.toHaveBeenCalled();
  });

  it("Returns Error if there was database failure", async () => {
    vi.mocked(userModel.getUser).mockRejectedValue(new Error("Test Error"));

    await expect(userService.loginUser(email, password)).rejects.toThrow(
      new Error("Test Error"),
    );
  });
});

describe("# Refresh User", () => {
  const oldRefreshToken = "old-refresh-token";
  const newRefreshToken = "new-refresh-token";
  const newAccessToken = "new-access-token";

  beforeEach(() => {
    vi.spyOn(tokenHelpers, "getUserIdFromRefreshToken").mockReturnValue(
      user._id,
    );
    vi.spyOn(tokenHelpers, "createAccessToken").mockReturnValue(newAccessToken);
    vi.spyOn(tokenHelpers, "createRefreshToken").mockReturnValue(
      newRefreshToken,
    );
    vi.mocked(userModel.getByID).mockResolvedValue({
      ...user,
      refreshToken: tokenHelpers.hashRefreshToken(oldRefreshToken),
    } as User);
    vi.mocked(userModel.addRefreshToken).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Propagates 401 from verification without accessing the database", async () => {
    vi.mocked(tokenHelpers.getUserIdFromRefreshToken).mockImplementation(() => {
      throw new novelotError(401, "Unauthorized");
    });

    await expect(
      userService.refreshUser(oldRefreshToken),
    ).rejects.toMatchObject({ status: 401, message: "Unauthorized" });

    expect(
      tokenHelpers.getUserIdFromRefreshToken,
    ).toHaveBeenCalledExactlyOnceWith(oldRefreshToken);
    expect(userModel.getByID).not.toHaveBeenCalled();
    expect(userModel.getUser).not.toHaveBeenCalled();
    expect(userModel.addRefreshToken).not.toHaveBeenCalled();
    expect(tokenHelpers.createAccessToken).not.toHaveBeenCalled();
    expect(tokenHelpers.createRefreshToken).not.toHaveBeenCalled();
  });

  it.each([
    { reason: "string", id: user._id.toString() },
    { reason: "number", id: 123 },
    { reason: "plain object", id: {} },
    { reason: "null", id: null },
  ])(
    "Rejects an extracted $reason ID before accessing the database",
    async ({ id }) => {
      vi.mocked(tokenHelpers.getUserIdFromRefreshToken).mockReturnValue(
        id as unknown as mongoose.Types.ObjectId,
      );

      const result = userService.refreshUser(oldRefreshToken);
      await expect(result).rejects.toBeInstanceOf(novelotError);
      await expect(result).rejects.toMatchObject({
        status: 401,
        message: "Unauthorized",
      });

      expect(userModel.getByID).not.toHaveBeenCalled();
      expect(userModel.getUser).not.toHaveBeenCalled();
      expect(userModel.addRefreshToken).not.toHaveBeenCalled();
      expect(tokenHelpers.createAccessToken).not.toHaveBeenCalled();
      expect(tokenHelpers.createRefreshToken).not.toHaveBeenCalled();
    },
  );

  it("Converts a missing user's 404 into a new 401 error", async () => {
    const error = new novelotError(404, "User not Found");
    vi.mocked(userModel.getByID).mockRejectedValue(error);

    const result = userService.refreshUser(oldRefreshToken);
    await expect(result).rejects.toBeInstanceOf(novelotError);
    await expect(result).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    });
    await expect(result).rejects.not.toBe(error);

    expect(userModel.getByID).toHaveBeenCalledExactlyOnceWith(user._id);
    expect(userModel.addRefreshToken).not.toHaveBeenCalled();
    expect(tokenHelpers.createAccessToken).not.toHaveBeenCalled();
    expect(tokenHelpers.createRefreshToken).not.toHaveBeenCalled();
  });

  it.each([
    { reason: "database failure", error: new Error("Database unavailable") },
    {
      reason: "non-404 application error",
      error: new novelotError(500, "Database unavailable"),
    },
  ])("Propagates lookup errors: $reason", async ({ error }) => {
    vi.mocked(userModel.getByID).mockRejectedValue(error);

    await expect(userService.refreshUser(oldRefreshToken)).rejects.toBe(error);

    expect(userModel.getByID).toHaveBeenCalledExactlyOnceWith(user._id);
    expect(userModel.addRefreshToken).not.toHaveBeenCalled();
    expect(tokenHelpers.createAccessToken).not.toHaveBeenCalled();
    expect(tokenHelpers.createRefreshToken).not.toHaveBeenCalled();
  });

  it("Throws 401 when the token does not match the stored hash", async () => {
    await expect(
      userService.refreshUser("different-refresh-token"),
    ).rejects.toMatchObject({ status: 401, message: "Unauthorized" });

    expect(userModel.addRefreshToken).not.toHaveBeenCalled();
    expect(tokenHelpers.createAccessToken).not.toHaveBeenCalled();
    expect(tokenHelpers.createRefreshToken).not.toHaveBeenCalled();
  });

  it("Returns new tokens and stores a hash of the replacement, not the old token", async () => {
    await expect(userService.refreshUser(oldRefreshToken)).resolves.toEqual({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    expect(
      tokenHelpers.getUserIdFromRefreshToken,
    ).toHaveBeenCalledExactlyOnceWith(oldRefreshToken);
    expect(userModel.getByID).toHaveBeenCalledExactlyOnceWith(user._id);
    expect(userModel.getUser).not.toHaveBeenCalled();
    expect(tokenHelpers.createAccessToken).toHaveBeenCalledExactlyOnceWith(
      user._id,
    );
    expect(tokenHelpers.createRefreshToken).toHaveBeenCalledExactlyOnceWith(
      user._id,
    );
    expect(userModel.addRefreshToken).toHaveBeenCalledOnce();
    const [storedEmail, storedToken] = vi.mocked(userModel.addRefreshToken).mock
      .calls[0];
    expect(storedEmail).toBe(email);
    expect(storedToken).not.toBe(newRefreshToken);
    expect(storedToken).toBe(tokenHelpers.hashRefreshToken(newRefreshToken));
    expect(storedToken).not.toBe(
      tokenHelpers.hashRefreshToken(oldRefreshToken),
    );
  });

  it("Rejects rather than returning credentials when the update fails", async () => {
    const error = new Error("Failed to persist replacement");
    vi.mocked(userModel.addRefreshToken).mockRejectedValue(error);

    await expect(userService.refreshUser(oldRefreshToken)).rejects.toBe(error);

    expect(userModel.addRefreshToken).toHaveBeenCalledOnce();
  });
});

describe("# Get User Email From Access Token", () => {
  const authorization = "Bearer access-token";

  beforeEach(() => {
    vi.spyOn(tokenHelpers, "getUserIdFromAccessToken").mockReturnValue(
      user._id,
    );
    vi.mocked(userModel.getByID).mockResolvedValue(user);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Returns the email of the user the token belongs to", async () => {
    await expect(
      userService.getUserEmailFromAccessToken(authorization),
    ).resolves.toBe(email);

    expect(
      tokenHelpers.getUserIdFromAccessToken,
    ).toHaveBeenCalledExactlyOnceWith(authorization);
    expect(userModel.getByID).toHaveBeenCalledExactlyOnceWith(user._id);
  });

  it("Propagates 401 from verification without accessing the database", async () => {
    vi.mocked(tokenHelpers.getUserIdFromAccessToken).mockImplementation(() => {
      throw new novelotError(401, "Unauthorized");
    });

    await expect(
      userService.getUserEmailFromAccessToken(authorization),
    ).rejects.toMatchObject({ status: 401, message: "Unauthorized" });

    expect(userModel.getByID).not.toHaveBeenCalled();
  });

  it.each([
    { reason: "string", id: user._id.toString() },
    { reason: "number", id: 123 },
    { reason: "plain object", id: {} },
    { reason: "null", id: null },
  ])(
    "Rejects an extracted $reason ID before accessing the database",
    async ({ id }) => {
      vi.mocked(tokenHelpers.getUserIdFromAccessToken).mockReturnValue(
        id as unknown as mongoose.Types.ObjectId,
      );

      await expect(
        userService.getUserEmailFromAccessToken(authorization),
      ).rejects.toMatchObject({ status: 401, message: "Unauthorized" });

      expect(userModel.getByID).not.toHaveBeenCalled();
    },
  );

  it("Converts a missing user's 404 into a new 401 error", async () => {
    const error = new novelotError(404, "User not Found");
    vi.mocked(userModel.getByID).mockRejectedValue(error);

    const result = userService.getUserEmailFromAccessToken(authorization);
    await expect(result).rejects.toBeInstanceOf(novelotError);
    await expect(result).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    });
    await expect(result).rejects.not.toBe(error);

    expect(userModel.getByID).toHaveBeenCalledExactlyOnceWith(user._id);
  });

  it.each([
    { reason: "database failure", error: new Error("Database unavailable") },
    {
      reason: "non-404 application error",
      error: new novelotError(500, "Database unavailable"),
    },
  ])("Propagates lookup errors: $reason", async ({ error }) => {
    vi.mocked(userModel.getByID).mockRejectedValue(error);

    await expect(
      userService.getUserEmailFromAccessToken(authorization),
    ).rejects.toBe(error);

    expect(userModel.getByID).toHaveBeenCalledExactlyOnceWith(user._id);
  });
});

describe("# Logout User", () => {
  const userId = new mongoose.Types.ObjectId();
  it("Drops refresh token when valid id", async () => {
    const refreshToken = tokenHelpers.createRefreshToken(userId);
    vi.mocked(userModel.dropRefreshToken);

    await expect(userService.logoutUser(refreshToken)).resolves.toBeUndefined();

    expect(userModel.dropRefreshToken).toHaveBeenCalledExactlyOnceWith(userId);
  });

  it("Propagates database error", async () => {
    const error = new Error("Database Failure");
    const refreshToken = tokenHelpers.createRefreshToken(userId);
    vi.mocked(userModel.dropRefreshToken).mockRejectedValue(error);

    await expect(userService.logoutUser(refreshToken)).rejects.toMatchObject(
      error,
    );
  });
});
