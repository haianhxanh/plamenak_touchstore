"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate_order_status = exports.validate_order_id = void 0;
const joi_1 = __importDefault(require("joi"));
exports.validate_order_id = joi_1.default.number().required().messages({
    "any.required": "Order_id is required",
});
exports.validate_order_status = joi_1.default.string().trim().required().messages({
    "any.required": "Order Status is required",
});
