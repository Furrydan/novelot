import jwt from "jsonwebtoken";
import { Response } from "express";
import mongoose from "mongoose";
import { novelotError } from "./error.js";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

export function createAccessToken(userID: mongoose.Types.ObjectId) {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (typeof secret === "undefined") {
    throw new novelotError(500, "Access Token Secret Key is not defined");
  }
  if (!(userID instanceof mongoose.Types.ObjectId)) {
    throw new novelotError(500, "Bad UserID");
  }
  return jwt.sign({ userID }, secret, {
    expiresIn: "15m",
  });
}

export function createRefreshToken(userID: mongoose.Types.ObjectId) {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (typeof secret === "undefined") {
    throw new novelotError(500, "Refresh Token Secret Key is not defined");
  }
  if (!(userID instanceof mongoose.Types.ObjectId)) {
    throw new novelotError(500, "Bad UserID");
  }
  return jwt.sign({ userID }, secret, {
    expiresIn: "7d",
    jwtid: randomUUID(),
  });
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function matchesRefreshToken(
  token: string,
  storedDigest: string,
): boolean {
  const presented = Buffer.from(hashRefreshToken(token), "utf8");
  const stored = Buffer.from(storedDigest, "utf8");
  return (
    presented.length === stored.length && timingSafeEqual(presented, stored)
  );
}

export function sendAccessToken(accessToken: string, res: Response): void {
  res.send({ accessToken });
}

export function sendRefreshToken(refreshToken: string, res: Response): void {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    path: "/api/users",
  });
}

export function verifyRefreshToken(
  refreshToken: string,
): jwt.JwtPayload | string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (typeof secret === "undefined") {
    throw new novelotError(500, "Refresh Token Secret Key is not defined");
  }
  try {
    return jwt.verify(refreshToken, secret);
  } catch (err) {
    throw new novelotError(401, "Unauthorized");
  }
}

export function extractBearerToken(authorization: string): string {
  const parts = authorization.split(" ");
  if (
    parts.length !== 2 ||
    parts[0].toLowerCase() !== "bearer" ||
    parts[1] === ""
  ) {
    throw new novelotError(401, "Unauthorized");
  }
  return parts[1];
}

export function verifyAccessToken(
  authorization: string,
): jwt.JwtPayload | string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (typeof secret === "undefined") {
    throw new novelotError(500, "Access Token Secret Key is not defined");
  }
  const accessToken = extractBearerToken(authorization);
  try {
    return jwt.verify(accessToken, secret);
  } catch (err) {
    throw new novelotError(401, "Unauthorized");
  }
}

export function getUserIdFromRefreshToken(
  refreshToken: string,
): mongoose.Types.ObjectId {
  const payload = verifyRefreshToken(refreshToken);
  if (
    typeof payload === "string" ||
    typeof payload.userID !== "string" ||
    !mongoose.isObjectIdOrHexString(payload.userID)
  ) {
    throw new novelotError(401, "Unauthorized");
  }
  return new mongoose.Types.ObjectId(payload.userID);
}

export function getUserIdFromAccessToken(
  authorization: string,
): mongoose.Types.ObjectId {
  const payload = verifyAccessToken(authorization);
  if (
    typeof payload === "string" ||
    typeof payload.userID !== "string" ||
    !mongoose.isObjectIdOrHexString(payload.userID)
  ) {
    throw new novelotError(401, "Unauthorized");
  }
  return new mongoose.Types.ObjectId(payload.userID);
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    path: "/api/users",
  });
}
