import { describe, it, expect, vi, afterEach } from "vitest";
import mongoose from "mongoose";
import userModel from "@models/userModel.js";
import { User } from "@apptypes/User.js";
import { novelotError } from "@/helpers/error.ts";

const users = mongoose.model<User>("Users");
const email = "harry@gmail.com";
const storedToken = "stored-token-digest";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("# Add Refresh Token", () => {
  it("Updates the supplied user's token and returns true", async () => {
    const update = vi
      .spyOn(users, "findOneAndUpdate")
      .mockResolvedValue({ email, refreshToken: storedToken });

    await expect(userModel.addRefreshToken(email, storedToken)).resolves.toBe(
      true,
    );

    expect(update).toHaveBeenCalledExactlyOnceWith(
      { email },
      { $set: { refreshToken: storedToken } },
      { returnDocument: "after" },
    );
  });

  it("Throws 500 when no user matches", async () => {
    vi.spyOn(users, "findOneAndUpdate").mockResolvedValue(null);

    await expect(
      userModel.addRefreshToken(email, storedToken),
    ).rejects.toMatchObject({
      status: 500,
      message: "Failed to Update Refresh Token",
    });
  });

  it("Propagates database failures", async () => {
    const error = new Error("Database unavailable");
    vi.spyOn(users, "findOneAndUpdate").mockRejectedValue(error);

    await expect(userModel.addRefreshToken(email, storedToken)).rejects.toBe(
      error,
    );
  });
});

describe("# Get By ID", () => {
  const id = new mongoose.Types.ObjectId();

  it("Looks up and returns the user by ID", async () => {
    const user = { _id: id, email, refreshToken: storedToken };
    const lookup = vi.spyOn(users, "findById").mockResolvedValue(user);

    await expect(userModel.getByID(id)).resolves.toBe(user);
    expect(lookup).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("Throws 404 when the user does not exist", async () => {
    vi.spyOn(users, "findById").mockResolvedValue(null);

    await expect(userModel.getByID(id)).rejects.toMatchObject({
      status: 404,
      message: "User not Found",
    });
  });

  it("Propagates database failures", async () => {
    const error = new Error("Database unavailable");
    vi.spyOn(users, "findById").mockRejectedValue(error);

    await expect(userModel.getByID(id)).rejects.toBe(error);
  });
});

describe("# DropRefreshToken", () => {
  it("Returns nothing when successful drop", async () => {
    const id = new mongoose.Types.ObjectId();
    const update = vi.spyOn(users, "updateOne").mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    });

    await expect(userModel.dropRefreshToken(id)).resolves.toBeUndefined();

    expect(update).toHaveBeenCalledExactlyOnceWith(
      { _id: id },
      {
        $set: { refreshToken: "" },
      },
    );
  });

  it("Propagates error", async () => {
    const id = new mongoose.Types.ObjectId();
    const error = new Error("Failed to Access Database");
    vi.spyOn(users, "updateOne").mockRejectedValue(error);

    await expect(userModel.dropRefreshToken(id)).rejects.toMatchObject(error);
  });

  it("Does not rely on matching an existing user", async () => {
    const id = new mongoose.Types.ObjectId();

    vi.spyOn(users, "updateOne").mockResolvedValue({
      acknowledged: true,
      matchedCount: 0,
      modifiedCount: 0,
      upsertedCount: 0,
      upsertedId: null,
    });

    await expect(userModel.dropRefreshToken(id)).resolves.toBeUndefined();
  });
});
