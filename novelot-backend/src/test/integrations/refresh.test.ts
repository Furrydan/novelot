import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { hash } from "bcryptjs";
import { createRefreshToken, hashRefreshToken } from "@helpers/token.js";
import jwt from "jsonwebtoken";
import app from "@/app.js";

let mongoServer: MongoMemoryServer;
const accessSecret = "test-access-secret";
const refreshSecret = "test-refresh-secret";
const email = "refresh@example.com";
const password = "correct-password";
let userId: mongoose.Types.ObjectId;
let hashedPassword: string;

beforeAll(async () => {
  vi.stubEnv("ACCESS_TOKEN_SECRET", accessSecret);
  vi.stubEnv("REFRESH_TOKEN_SECRET", refreshSecret);
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  hashedPassword = await hash(password, 10);
});

afterAll(async () => {
  try {
    await mongoose.disconnect();
    await mongoServer?.stop();
  } finally {
    vi.unstubAllEnvs();
  }
});

beforeEach(async () => {
  const users = mongoose.connection.db!.collection("users");
  await users.deleteMany({});
  userId = new mongoose.Types.ObjectId();
  await users.insertOne({
    _id: userId,
    email,
    password: hashedPassword,
    refreshToken: "",
  });
});

async function expectRejected(token?: string) {
  const users = mongoose.connection.db!.collection("users");
  const before = await users.find({}).sort({ _id: 1 }).toArray();
  const req = request(app).post("/api/users/refresh");
  if (token !== undefined) {
    req.set("Cookie", `refreshToken=${token}`);
  }
  const res = await req;

  expect.soft(res.status).toBe(401);
  expect(res.body).not.toHaveProperty("accessToken");
  expect(res.body).not.toHaveProperty("refreshToken");
  expect(res.headers["set-cookie"]).toBeUndefined();
  expect(await users.find({}).sort({ _id: 1 }).toArray()).toEqual(before);
}

describe("POST /api/users/refresh", () => {
  it("Supports login followed by two cookie-only refreshes and persists hashed credentials", async () => {
    const agent = request.agent(app);
    const users = mongoose.connection.db!.collection("users");
    const login = await agent
      .post("/api/users/login")
      .send({ email, password });
    expect(login.status).toBe(200);
    let previousToken = login.headers["set-cookie"][0]
      .split(";")[0]
      .slice("refreshToken=".length);

    let previousUser = await users.findOne({ _id: userId });
    expect(previousUser).not.toBeNull();

    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await agent.post("/api/users/refresh");
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body).not.toHaveProperty("refreshToken");

      const cookies = res.headers["set-cookie"] as unknown as string[];
      expect(cookies).toEqual(
        expect.arrayContaining([expect.stringMatching(/^refreshToken=/)]),
      );
      const cookie = cookies.find((value) =>
        value.startsWith("refreshToken="),
      )!;
      expect(cookie).toMatch(/; HttpOnly(?:;|$)/);
      expect(cookie).toMatch(/; Path=\/api\/users(?:;|$)/);
      const refreshToken = cookie.split(";")[0].slice("refreshToken=".length);
      expect(refreshToken).not.toBe(previousToken);

      expect(jwt.verify(res.body.accessToken, accessSecret)).toMatchObject({
        userID: userId.toString(),
      });
      expect(jwt.verify(refreshToken, refreshSecret)).toMatchObject({
        userID: userId.toString(),
        jti: expect.any(String),
      });

      const storedUser = await users.findOne({ _id: userId });
      expect(storedUser).not.toBeNull();
      expect(storedUser!.refreshToken).not.toBe(refreshToken);
      expect(storedUser!.refreshToken).not.toBe(previousUser!.refreshToken);
      expect(storedUser!.refreshToken).toBe(hashRefreshToken(refreshToken));
      expect(storedUser).toEqual({
        ...previousUser,
        refreshToken: storedUser!.refreshToken,
      });
      previousUser = storedUser;
      await expectRejected(previousToken);
      previousToken = refreshToken;
    }
  });

  it("Rejects a missing cookie without requiring a request body", async () => {
    await expectRejected();
  });

  it.each([
    { reason: "malformed token", token: () => "not-a-jwt" },
    {
      reason: "wrong signature",
      token: () => jwt.sign({ userID: userId }, "wrong-secret"),
    },
    {
      reason: "expired token",
      token: () =>
        jwt.sign({ userID: userId }, refreshSecret, { expiresIn: -60 }),
    },
    { reason: "missing userID", token: () => jwt.sign({}, refreshSecret) },
    {
      reason: "malformed userID",
      token: () => jwt.sign({ userID: "invalid-id" }, refreshSecret),
    },
    {
      reason: "non-string userID",
      token: () => jwt.sign({ userID: 123 }, refreshSecret),
    },
  ])(
    "Rejects $reason even when its hash is stored",
    async ({ token: createToken }) => {
      const token = createToken();
      await mongoose.connection
        .db!.collection("users")
        .updateOne(
          { _id: userId },
          { $set: { refreshToken: hashRefreshToken(token) } },
        );

      await expectRejected(token);
    },
  );

  it("Rejects a valid token when the user has no stored refresh token", async () => {
    const token = jwt.sign({ userID: userId }, refreshSecret, {
      expiresIn: "7d",
    });

    await expectRejected(token);
  });

  it("Rejects a different valid token even when its first 72 characters match", async () => {
    const token = createRefreshToken(userId);
    const differentToken = createRefreshToken(userId);
    expect(token).not.toBe(differentToken);
    expect(token.slice(0, 72)).toBe(differentToken.slice(0, 72));
    const storedHash = hashRefreshToken(differentToken);
    expect(hashRefreshToken(token)).not.toBe(storedHash);
    await mongoose.connection
      .db!.collection("users")
      .updateOne({ _id: userId }, { $set: { refreshToken: storedHash } });

    await expectRejected(token);
  });

  it("Rejects legacy bcrypt storage until the user logs in again", async () => {
    const token = createRefreshToken(userId);
    await mongoose.connection
      .db!.collection("users")
      .updateOne(
        { _id: userId },
        { $set: { refreshToken: await hash(token, 10) } },
      );

    await expectRejected(token);

    const agent = request.agent(app);
    const login = await agent
      .post("/api/users/login")
      .send({ email, password });
    expect(login.status).toBe(200);
    const loginToken = login.headers["set-cookie"][0]
      .split(";")[0]
      .slice("refreshToken=".length);
    const storedUser = await mongoose.connection
      .db!.collection("users")
      .findOne({ _id: userId });
    expect(storedUser!.refreshToken).toBe(hashRefreshToken(loginToken));
    await agent.post("/api/users/refresh").expect(200);
  });

  it("Rejects a valid token when its user no longer exists with 401", async () => {
    const token = jwt.sign({ userID: userId }, refreshSecret, {
      expiresIn: "7d",
    });
    await mongoose.connection
      .db!.collection("users")
      .deleteOne({ _id: userId });

    await expectRejected(token);
  });
});
