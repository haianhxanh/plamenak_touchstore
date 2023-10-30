"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const get_order_controller_1 = require("../controllers/get_order.controller");
const update_order_status_controller_1 = require("../controllers/update_order_status.controller");
const api_authorization_1 = require("../Authorization/api_authorization");
const router = express_1.default.Router();
router.get("/orders", api_authorization_1.auth, get_order_controller_1.get_unfulfilled_orders);
router.put("/update_order", api_authorization_1.auth, update_order_status_controller_1.update_order_status);
router.get("/all_orders", api_authorization_1.auth, get_order_controller_1.all_orders);
exports.default = router;
