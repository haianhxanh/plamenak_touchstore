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
exports.update_order_status = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const orders_model_1 = __importDefault(require("../model/orders.model"));
const input_validation_1 = require("../utilities/input_validation");
const constants_1 = require("../utilities/constants");
dotenv_1.default.config();
const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;
const update_order_status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        /*------------------VALIDATING THE NEEDED INPUT DATA FOR THE PROGRAM-------------------------*/
        let valid_input_id = input_validation_1.validate_order_id.validate(req.body.order_id);
        if (valid_input_id.error) {
            const error_message = valid_input_id.error.details[0].message;
            return res.status(400).json({ message: `order_id - ${error_message}` });
        }
        const valid_order_id = valid_input_id.value;
        let valid_input_status = input_validation_1.validate_order_status.validate(req.body.status);
        if (valid_input_status.error) {
            const error_message = valid_input_status.error.details[0].message;
            return res.status(400).json({ message: `status - ${error_message}` });
        }
        const valid_order_status = valid_input_status.value;
        /*----------------------------------------DOUBLE CHECKING ORDER EXISTENCE IN THE DATABASE-------------------------------------*/
        const find_order = yield orders_model_1.default.findOne({
            where: {
                order_id: +valid_order_id,
            },
        });
        if (find_order) {
            /*-----------------UPDATING THE ORDERS WITH THEIR CURRENT STATUS FROM THE CARRIER PROVIDER TO THE DATA IN THE DATABASE---------------------*/
            const received_order = find_order.dataValues;
            if (received_order.status != constants_1.ORDER_STATUS.FULFILLED) {
                /*------SAME STATUS ------*/
                if (valid_order_status === received_order.status) {
                    return res.status(400).json({
                        message: `Order with ID - ${valid_order_id} is already with an ${valid_order_status} status.`,
                    });
                }
                /*------ANY STATUS FROM ORDER_STATUS BUT FULFILLED ------*/
                if (valid_order_status != constants_1.ORDER_STATUS.FULFILLED &&
                    Object.values(constants_1.ORDER_STATUS).includes(valid_order_status)) {
                    const update_status = yield orders_model_1.default.update({ status: valid_order_status }, {
                        where: {
                            order_id: +valid_order_id,
                        },
                    });
                    const order_tags = yield axios_1.default
                        .get(`https://${STORE}/admin/api/${API_VERSION}/orders/${valid_order_id}.json`, {
                        headers: {
                            "X-Shopify-Access-Token": ACCESS_TOKEN,
                        },
                    })
                        .then((response) => {
                        let order_tags = response.data.order.tags;
                        let order_tags_arr = order_tags.split(",");
                        order_tags_arr.forEach((tag, i) => {
                            if (tag.includes("TS_")) {
                                order_tags_arr[i] = valid_order_status;
                            }
                        });
                        order_tags = order_tags_arr.toString();
                        return order_tags;
                    });
                    const body = {
                        order: {
                            id: valid_order_id,
                            tags: order_tags,
                        },
                    };
                    const { data } = yield axios_1.default.put(`https://${STORE}/admin/api/${API_VERSION}/orders/${valid_order_id}.json`, body, {
                        headers: {
                            "X-Shopify-Access-Token": ACCESS_TOKEN,
                        },
                    });
                    return res.status(200).json({
                        message: `Status for order with ID - ${valid_order_id} is now set to ${valid_order_status}.`,
                    });
                }
                /*------STATUS FULFILLED------*/
                if (valid_order_status === constants_1.ORDER_STATUS.FULFILLED) {
                    /*-----------UPDATING THE FULFILLMENT STATUS FOR ORDERS ON SHOPIFY----------------------*/
                    /*------------------Get list of fulfillment orders------------------------*/
                    const order_tags = yield axios_1.default
                        .get(`https://${STORE}/admin/api/${API_VERSION}/orders/${valid_order_id}.json`, {
                        headers: {
                            "X-Shopify-Access-Token": ACCESS_TOKEN,
                        },
                    })
                        .then((response) => {
                        let order_tags = response.data.order.tags;
                        let order_tags_arr = order_tags.split(",");
                        order_tags_arr.forEach((tag, i) => {
                            if (tag.includes("TS_")) {
                                order_tags_arr[i] = valid_order_status;
                            }
                        });
                        order_tags = order_tags_arr.toString();
                        return order_tags;
                    });
                    const body = {
                        order: {
                            id: valid_order_id,
                            tags: order_tags,
                        },
                    };
                    axios_1.default.put(`https://${STORE}/admin/api/${API_VERSION}/orders/${valid_order_id}.json`, body, {
                        headers: {
                            "X-Shopify-Access-Token": ACCESS_TOKEN,
                        },
                    });
                    const { data } = yield axios_1.default.get(`https://${STORE}/admin/api/${API_VERSION}/orders/${valid_order_id}/fulfillment_orders.json`, {
                        headers: {
                            "X-Shopify-Access-Token": ACCESS_TOKEN,
                        },
                    });
                    data.fulfillment_orders.map((order) => __awaiter(void 0, void 0, void 0, function* () {
                        const real_result = order.line_items.map((orders) => {
                            return { fulfillment_order_id: orders.fulfillment_order_id };
                        });
                        if (order.status === "closed") {
                            res.status(200).json({
                                message: `Fulfillment order ${order.id} has an unfulfillable status= closed.`,
                            });
                        }
                        else {
                            /*------------------------------------------------------CREATE FULFILLMENT---------------------------------------------------------------*/
                            const update_status = yield orders_model_1.default.update({ status: valid_order_status }, {
                                where: {
                                    order_id: +valid_order_id,
                                },
                            });
                            const create_fulfillment = {
                                fulfillment: {
                                    line_items_by_fulfillment_order: real_result,
                                },
                            };
                            const newer_res = yield axios_1.default.post(`https://${STORE}/admin/api/${API_VERSION}/fulfillments.json`, create_fulfillment, {
                                headers: {
                                    "X-Shopify-Access-Token": ACCESS_TOKEN,
                                    "Content-Type": "application/json",
                                },
                            });
                            res.status(200).json({
                                message: `Status for order with ID - ${valid_order_id} is now updated to FULFILLED`,
                            });
                        }
                    }));
                }
                else {
                    return res.status(400).json({
                        message: `Wrong UPDATE INPUT. Use either ${constants_1.ORDER_STATUS.FULFILLED}, ${constants_1.ORDER_STATUS.ERROR}, ${constants_1.ORDER_STATUS.PACKED}, ${constants_1.ORDER_STATUS.IN_PROGRESS} to send status update.`,
                    });
                }
            }
            else if (received_order.status === constants_1.ORDER_STATUS.IN_PROGRESS) {
                if (valid_order_status === constants_1.ORDER_STATUS.IN_PROGRESS) {
                    return res.status(400).json({
                        message: `Order with ID - ${valid_order_id} is already in progress.`,
                    });
                }
                if (valid_order_status === "unfulfilled") {
                    return res.status(400).json({
                        message: `Order with ID - ${valid_order_id} is already in_progress. Cannot change status to UNFULFILLED.`,
                    });
                }
                if (valid_order_status === "fulfilled") {
                    /*-----------UPDATING THE FULFILLMENT STATUS FOR ORDERS ON SHOPIFY----------------------*/
                    /*------------------Get list of fulfillment orders------------------------*/
                    const { data } = yield axios_1.default.get(`https://${STORE}/admin/api/${API_VERSION}/orders/${valid_order_id}/fulfillment_orders.json`, {
                        headers: {
                            "X-Shopify-Access-Token": ACCESS_TOKEN,
                        },
                    });
                    data.fulfillment_orders.map((order) => __awaiter(void 0, void 0, void 0, function* () {
                        const real_result = order.line_items.map((orders) => {
                            return { fulfillment_order_id: orders.fulfillment_order_id };
                        });
                        if (order.status === "closed") {
                            res.status(200).json({
                                message: `Fulfillment order ${order.id} has an unfulfillable status= closed.`,
                            });
                        }
                        else {
                            const update_status = yield orders_model_1.default.update({ status: valid_order_status }, {
                                where: {
                                    order_id: +valid_order_id,
                                },
                            });
                            const create_fulfillment = {
                                fulfillment: {
                                    line_items_by_fulfillment_order: real_result,
                                },
                            };
                            const newer_res = yield axios_1.default.post(`https://${STORE}/admin/api/${API_VERSION}/fulfillments.json`, create_fulfillment, {
                                headers: {
                                    "X-Shopify-Access-Token": ACCESS_TOKEN,
                                    "Content-Type": "application/json",
                                },
                            });
                            res.status(200).json({
                                message: `Status for order with ID - ${valid_order_id} is now updated to FULFILLED`,
                            });
                        }
                    }));
                    return res.status(200).json({
                        message: `Status for order with ID - ${valid_order_id} is now updated to FULFILLED`,
                    });
                }
                else {
                    return res.status(400).json({
                        message: `Wrong UPDATE INPUT. Use either 'fulfilled', 'in_progress', or 'fulfilled to send status update.`,
                    });
                }
            }
            else {
                return res.status(400).json({
                    message: `Order with ID - ${valid_order_id} has already been FULFILLED.`,
                });
            }
        }
        else {
            res.status(404).json({
                message: `Order with id - ${valid_order_id} - NOT FOUND`,
            });
        }
    }
    catch (error) {
        console.error("Error updating status for unfulfilled_orders:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.update_order_status = update_order_status;
