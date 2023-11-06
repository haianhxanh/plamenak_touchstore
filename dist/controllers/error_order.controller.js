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
exports.error_order = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const input_validation_1 = require("../utilities/input_validation");
const constants_1 = require("../utilities/constants");
const status_update_1 = require("../utilities/status_update");
dotenv_1.default.config();
const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;
const error_order = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        /*------------------VALIDATING THE NEEDED INPUT DATA FOR THE PROGRAM-------------------------*/
        let valid_input_id = input_validation_1.validate_order_id.validate(req.body.order_id);
        if (valid_input_id.error) {
            const error_message = valid_input_id.error.details[0].message;
            return res.status(400).json({ message: `order_id - ${error_message}` });
        }
        const order_id = valid_input_id.value;
        (0, status_update_1.error_status_update)(order_id.toString(), constants_1.ORDER_STATUS.ERROR, req.body.error_id, req.body.error_name, req.body.error_note);
        res.status(200).json({
            message: `Status of order ${order_id} has been updated to ${constants_1.ORDER_STATUS.ERROR}, see Shopify admin for more details`,
        });
    }
    catch (error) {
        console.error(`Error updating status of order ${req.body.order_id}`, error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.error_order = error_order;
