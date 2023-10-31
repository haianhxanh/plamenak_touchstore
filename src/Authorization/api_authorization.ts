import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();
const { APP_SECRET_KEY } = process.env;

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const access_key: any = req.headers.authorization;
    const key = access_key.split(" ")[1];
    const decoded_key: string = Buffer.from(key, "base64").toString("utf8");

    if (decoded_key !== APP_SECRET_KEY!) {
      return res.status(401).json({
        message:
          "INVALID ACCESS KEY. You are not authorized to access this endpoint",
      });
    } else if (decoded_key === APP_SECRET_KEY!) {
      next();
    }
  } catch (err) {
    return res.status(401).json({
      message:
        "INVALID ACCESS KEY. You are not authorized to access this endpoint",
    });
  }
};
