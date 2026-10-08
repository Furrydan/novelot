import userModel from "@models/userModel.js";
import { hash, compare } from "bcryptjs";
import {
  createAccessToken,
  createRefreshToken,
  getUserIdFromAccessToken,
  getUserIdFromRefreshToken,
  hashRefreshToken,
  matchesRefreshToken,
} from "@helpers/token.js";
import { type User } from "@apptypes/User.js";
import { novelotError } from "@helpers/error.js";
import mongoose from "mongoose";

type tokens = {
  accessToken: string;
  refreshToken: string;
};

async function registerUser(email: string, password: string): Promise<boolean> {
  const userExists: boolean = await userModel.checkEmailExists(email);

  if (userExists) {
    throw new novelotError(409, "User already exists");
  }

  const hashedPassword: string = await hash(password, 10);

  await userModel.addNewUser(email, hashedPassword);
  return true;
}

async function loginUser(email: string, password: string): Promise<tokens> {
  let user: User;
  try {
    user = await userModel.getUser(email);
  } catch (err) {
    if (err instanceof novelotError && err.status === 404) {
      throw new novelotError(401, "Email or Password is incorrect");
    }
    throw err;
  }

  const passwordIsValid: boolean = await compare(password, user.password);

  if (!passwordIsValid) {
    throw new novelotError(401, "Email or Password is incorrect");
  }

  const refreshToken: string = createRefreshToken(user._id);
  const accessToken: string = createAccessToken(user._id);

  const hashedRefreshToken = hashRefreshToken(refreshToken);

  await userModel.addRefreshToken(email, hashedRefreshToken);

  const tokens: tokens = { accessToken, refreshToken };
  return tokens;
}

async function refreshUser(refreshToken: string): Promise<tokens> {
  const userId = getUserIdFromRefreshToken(refreshToken);
  if (!(userId instanceof mongoose.Types.ObjectId)) {
    throw new novelotError(401, "Unauthorized");
  }
  let user: User;
  try {
    user = await userModel.getByID(userId);
  } catch (err) {
    if (err instanceof novelotError && err.status === 404) {
      throw new novelotError(401, "Unauthorized");
    }
    throw err;
  }
  const dbToken = user.refreshToken;
  const id = user._id;

  const tokenMatchesDB = matchesRefreshToken(refreshToken, dbToken);

  if (!tokenMatchesDB) {
    throw new novelotError(401, "Unauthorized");
  }

  const newAccessToken = createAccessToken(id);
  const newRefreshToken = createRefreshToken(id);

  const hashedRefreshToken = hashRefreshToken(newRefreshToken);

  await userModel.addRefreshToken(user.email, hashedRefreshToken);

  const tokens: tokens = {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
  return tokens;
}

async function getUserEmailFromAccessToken(
  accessToken: string,
): Promise<string> {
  const userId = getUserIdFromAccessToken(accessToken);
  if (!(userId instanceof mongoose.Types.ObjectId)) {
    throw new novelotError(401, "Unauthorized");
  }
  let user: User;
  try {
    user = await userModel.getByID(userId);
  } catch (err) {
    if (err instanceof novelotError && err.status === 404) {
      throw new novelotError(401, "Unauthorized");
    }
    throw err;
  }
  return user.email;
}

async function logoutUser(refreshToken: string): Promise<void> {
  const userId = getUserIdFromRefreshToken(refreshToken);

  await userModel.dropRefreshToken(userId);
  return;
}

export default {
  registerUser,
  loginUser,
  refreshUser,
  getUserEmailFromAccessToken,
  logoutUser,
};
