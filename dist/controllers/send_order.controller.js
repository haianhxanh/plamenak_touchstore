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
const constants_1 = require("../utilities/constants");
const util_1 = require("util");
const sleep = (0, util_1.promisify)(setTimeout);
dotenv_1.default.config();
const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;
const send_order = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const internal_fullfillment_response = [];
    try {
        /*------------------VALIDATING THE NEEDED INPUT DATA FOR THE PROGRAM-------------------------*/
        const consignments = req.body.consignments;
        for (const consignment of consignments) {
            try {
                const { data } = yield axios_1.default.get(`https://${STORE}/admin/api/${API_VERSION}/orders/${consignment.order_id}/fulfillment_orders.json`, {
                    headers: {
                        "X-Shopify-Access-Token": ACCESS_TOKEN,
                    },
                });
                if (data.fulfillment_orders[0].status == "closed") {
                    const update_status = yield orders_model_1.default.update({ status: constants_1.ORDER_STATUS.FULFILLED }, {
                        where: {
                            order_id: +consignment.order_id,
                        },
                    });
                    let message = "Order was already fulfilled and cannot be fulfilled again";
                    internal_fullfillment_response.push({
                        order_id: consignment.order_id,
                        status: message,
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
                            const carrier = constants_1.CARRIERS.find((carrier) => carrier.carrier_product == consignment.product);
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
                                        company: (carrier === null || carrier === void 0 ? void 0 : carrier.carrier_product_name) || "",
                                        number: consignment.track_ids[0] || "",
                                        url: (carrier === null || carrier === void 0 ? void 0 : carrier.tracking_url) + consignment.track_ids[0] || "",
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
                                /*----------------------UPDATE DATABASE--------------------*/
                                internal_fullfillment_response.push({
                                    order_id: consignment.order_id,
                                    status: "Order fulfilled",
                                });
                                const update_status = yield orders_model_1.default.update({ status: constants_1.ORDER_STATUS.FULFILLED }, {
                                    where: {
                                        order_id: +consignment.order_id,
                                    },
                                });
                            }
                        }));
                    }
                    catch (error) {
                        console.error("Error mapping an order", error);
                    }
                }
            }
            catch (error) {
                console.error("Error getting unfulfilled order", error);
            }
            yield sleep(500);
        }
        console.log("internal_fullfillment_response", internal_fullfillment_response);
        return res.status(200).json(internal_fullfillment_response);
    }
    catch (error) {
        console.error("Error updating status for unfulfilled_orders:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.send_order = send_order;
