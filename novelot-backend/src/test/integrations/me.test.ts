import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createAccessToken } from "@/helpers/token.ts";
import app from "@/app.ts";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  process.env.ACCESS_TOKEN_SECRET = "test-access-secret";
  process.env.REFRESH_TOKEN_SECRET = "test-refres-secret";

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await mongoose.connection.db?.collection("users").deleteMany({});
});

describe("GET /api/users/me", () => {
  it("Returns user email", async () => {
    const email = "test@email.com";
    const id = new mongoose.mongo.ObjectId();
    await mongoose.connection.db?.collection("users").insertOne({
      _id: id,
      email,
      password: "password",
      refreshToken: "",
    });

    const accessToken = createAccessToken(id);

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email });
  });

  async function expectUnauthorized(authorization?: string) {
    const req = request(app).get("/api/users/me");
    if (authorization !== undefined) {
      req.set("Authorization", authorization);
    }
    const res = await req;
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  }

  it("Rejects a request with no Authorization header", async () => {
    await expectUnauthorized();
  });

  it.each([
    {
      reason: "an expired token",
      token: () =>
        jwt.sign({ userID: new mongoose.Types.ObjectId() }, "test-access-secret", { expiresIn: -60 }),
    },
    { reason: "a malformed token", token: () => "not-a-jwt" },
    { reason: "an empty token", token: () => "" },
    { reason: "a random string", token: () => "aGVsbG8.d29ybGQ.Z2FyYmFnZQ" },
    {
      reason: "a token signed with the wrong secret",
      token: () => jwt.sign({ userID: new mongoose.Types.ObjectId() }, "wrong-secret"),
    },
  ])("Rejects $reason", async ({ token }) => {
    await expectUnauthorized(`Bearer ${token()}`);
  });

  it("Rejects a valid token for a user that does not exist", async () => {
    const accessToken = createAccessToken(new mongoose.Types.ObjectId());

    await expectUnauthorized(`Bearer ${accessToken}`);
  });
});
