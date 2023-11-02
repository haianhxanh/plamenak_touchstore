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
        const auth = req.headers.authorization;
        const base64Credentials = auth.split(" ")[1];
        const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
        const [username, password] = credentials.split(":");
        if (username === APP_USERNAME && password === APP_PASSWORD) {
            next();
        }
        else {
            res.setHeader("WWW-Authenticate", 'Basic realm="Authentication Required"');
            return res.status(401).send("401 Unauthorized: Incorrect credentials.");
        }
    }
    catch (err) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Authentication Required"');
        return res.status(401).send("401 Unauthorized: Incorrect credentials.");
    }
});
exports.auth = auth;
