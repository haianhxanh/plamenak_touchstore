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
exports.send_order = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const orders_model_1 = __importDefault(require("../model/orders.model"));
const input_validation_1 = require("../utilities/input_validation");
const constants_1 = require("../utilities/constants");
dotenv_1.default.config();
const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;
const send_order = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        /*------------------VALIDATING THE NEEDED INPUT DATA FOR THE PROGRAM-------------------------*/
        let valid_input_order_id = input_validation_1.validate_order_id.validate(req.body.consignments[0].order_id);
        if (valid_input_order_id.error) {
            const error_message = valid_input_order_id.error.details[0].message;
            return res.status(400).json({ message: `order_id - ${error_message}` });
        }
        const valid_order_id = valid_input_order_id.value;
        let tracking_number = req.body.consignments[0].track_ids[0];
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
                    order_tags_arr[i] = constants_1.ORDER_STATUS.FULFILLED;
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
        try {
            const { data } = yield axios_1.default.get(`https://${STORE}/admin/api/${API_VERSION}/orders/${valid_order_id}/fulfillment_orders.json`, {
                headers: {
                    "X-Shopify-Access-Token": ACCESS_TOKEN,
                },
            });
            if (data.fulfillment_orders[0].status == "closed") {
                /*--------------------------------UPDATE DATABASE---------------------------------------------*/
                const update_status = yield orders_model_1.default.update({ status: constants_1.ORDER_STATUS.FULFILLED }, {
                    where: {
                        order_id: +valid_order_id,
                    },
                });
                return res.status(400).json({
                    message: "Order was already fulfilled, database updated accordingly",
                });
            }
            else {
                try {
                    data.fulfillment_orders.map((order) => __awaiter(void 0, void 0, void 0, function* () {
                        const order_fullfilment_id = order.line_items[0].fulfillment_order_id;
                        const order_line_items = order.line_items.map((item) => {
                            return { id: item.id, quantity: item.quantity };
                        });
                        /*------------------------------------------------------CREATE FULFILLMENT---------------------------------------------------------------*/
                        const create_fulfillment = {
                            fulfillment: {
                                line_items_by_fulfillment_order: [
                                    {
                                        fulfillment_order_id: order_fullfilment_id,
                                        fulfillment_order_line_items: order_line_items,
                                    },
                                ],
                                notify_customer: true,
                                tracking_info: {
                                    number: tracking_number,
                                },
                            },
                        };
                        const create_fulfillment_res = yield axios_1.default.post(`https://${STORE}/admin/api/${API_VERSION}/fulfillments.json`, create_fulfillment, {
                            headers: {
                                "X-Shopify-Access-Token": ACCESS_TOKEN,
                                "Content-Type": "application/json",
                            },
                        });
                        if (create_fulfillment_res.status === 201) {
                            /*--------------------------------UPDATE DATABASE---------------------------------------------*/
                            const update_status = yield orders_model_1.default.update({ status: constants_1.ORDER_STATUS.FULFILLED }, {
                                where: {
                                    order_id: +valid_order_id,
                                },
                            });
                        }
                        res.status(200).json({
                            message: `Status for order with ID - ${valid_order_id} is now updated to FULFILLED`,
                        });
                    }));
                }
                catch (error) {
                    console.error("Error mapping an order", error);
                    return res.status(500).json({ error: "Internal server error" });
                }
            }
        }
        catch (error) {
            console.error("Error getting unfulfilled order", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
    catch (error) {
        console.error("Error updating status for unfulfilled_orders:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.send_order = send_order;
