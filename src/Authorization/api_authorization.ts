import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();
const { APP_SECRET_KEY, APP_USERNAME, APP_PASSWORD } = process.env;

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const access_key: any = req.headers.authorization;

    const key = access_key.split(" ")[1];
    const decoded_key: string = Buffer.from(key, "base64").toString();

    const username = decoded_key.split(":")[0];
    const password = decoded_key.split(":")[1];

    if (!(username === APP_USERNAME && password === APP_PASSWORD)) {
      var error = new Error("Not Authenticated");
      res.status(401).set("WWW-Authenticate", "Basic");
      next(error);
    } else {
      res.status(200);
      next();
    }
  } catch (err) {
    return res.status(401).json({
      message:
        "Invalid username and password. You are not authorized to access this endpoint",
    });
  }
};
