import {
  it,
  describe,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "@/app.ts";
import { hash } from "bcryptjs";
import { createRefreshToken } from "@helpers/token.js";
import userModel from "@models/userModel.js";

let mongoServer: MongoMemoryServer;
const email = "test@gmail.com";
const password = "test-password";
const hashedPassword = await hash(password, 10);
const userId = new mongoose.Types.ObjectId();
const storedRefreshToken = "stored-refresh-token-hash";

beforeAll(async () => {
  process.env.ACCESS_TOKEN_SECRET = "test-access-secret";
  process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";

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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/users/logout", () => {
  it("Deletes refreshToken and clears the cookie when successful logout", async () => {
    const agent = request.agent(app);
    await mongoose.connection.db
      ?.collection("users")
      .insertOne({ email, password: hashedPassword, refreshToken: "" });

    const loginRes = await agent
      .post("/api/users/login")
      .send({ email, password });

    expect(loginRes.status).toBe(200);
    let user = await mongoose.connection.db
      ?.collection("users")
      .findOne({ email });
    expect(user?.refreshToken).not.toBe("");

    const logoutRes = await agent.post("/api/users/logout");

    expect(logoutRes.status).toBe(204);
    expect(logoutRes.headers["set-cookie"][0]).toMatch(
      /^refreshToken=; Path=\/api\/users; Expires=Thu, 01 Jan 1970/,
    );

    user = await mongoose.connection.db?.collection("users").findOne({ email });
    expect(user?.refreshToken).toBe("");
  });

  it.each([
    { reason: "cookie is missing", cookie: undefined },
    {
      reason: "token is signed with the wrong secret",
      cookie: `refreshToken=${jwt.sign({ userID: userId }, "wrong-secret")}`,
    },
  ])("Returns 401 when $reason", async ({ cookie }) => {
    await mongoose.connection.db?.collection("users").insertOne({
      _id: userId,
      email,
      password: hashedPassword,
      refreshToken: storedRefreshToken,
    });

    const req = request(app).post("/api/users/logout");
    if (cookie) {
      req.set("Cookie", cookie);
    }
    const res = await req;

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Unauthorized" });
    expect(res.headers["set-cookie"]).toBeUndefined();

    const user = await mongoose.connection.db
      ?.collection("users")
      .findOne({ _id: userId });
    expect(user?.refreshToken).toBe(storedRefreshToken);
  });

  it("Propagates database errors as 500 without clearing the cookie", async () => {
    vi.spyOn(userModel, "dropRefreshToken").mockRejectedValueOnce(
      new Error("DB down"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app)
      .post("/api/users/logout")
      .set("Cookie", `refreshToken=${createRefreshToken(userId)}`);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Internal Server Error" });
    expect(res.headers["set-cookie"]).toBeUndefined();
  });
});
