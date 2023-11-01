"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { APP_SECRET_KEY, APP_USERNAME, APP_PASSWORD } = process.env;
const auth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const access_key = req.headers.authorization;
        const key = access_key.split(" ")[1];
        const decoded_key = Buffer.from(key, "base64").toString();
        const username = decoded_key.split(":")[0];
        const password = decoded_key.split(":")[1];
        if (!(username === APP_USERNAME && password === APP_PASSWORD)) {
            var error = new Error("Not Authenticated");
            res.status(401).set("WWW-Authenticate", "Basic");
            next(error);
        }
        else {
            res.status(200);
            next();
        }
    }
    catch (err) {
        var error = new Error("Not Authenticated");
        res.status(401).set("WWW-Authenticate", "Basic");
        next(error);
    }
});
exports.auth = auth;
