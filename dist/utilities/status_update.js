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
exports.error_status_update = exports.status_update = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const orders_model_1 = __importDefault(require("../model/orders.model"));
dotenv_1.default.config();
const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;
const status_update = (order_id, status) => __awaiter(void 0, void 0, void 0, function* () {
    // update database
    const update_status = yield orders_model_1.default.update({ status: status }, {
        where: {
            order_id: order_id,
        },
    });
    // update Shopify
    const order_tags = yield axios_1.default
        .get(`https://${STORE}/admin/api/${API_VERSION}/orders/${order_id}.json`, {
        headers: {
            "X-Shopify-Access-Token": ACCESS_TOKEN,
        },
    })
        .then((response) => {
        let order_tags = response.data.order.tags;
        let order_tags_arr = order_tags.split(",");
        order_tags_arr.forEach((tag, i) => {
            if (tag.includes("TS_")) {
                order_tags_arr[i] = status;
            }
        });
        order_tags = order_tags_arr.toString();
        return order_tags;
    });
    const body = {
        order: {
            id: order_id,
            tags: order_tags,
        },
    };
    const { data } = yield axios_1.default.put(`https://${STORE}/admin/api/${API_VERSION}/orders/${order_id}.json`, body, {
        headers: {
            "X-Shopify-Access-Token": ACCESS_TOKEN,
        },
    });
});
exports.status_update = status_update;
const error_status_update = (order_id, status, error_id, error_name, error_note) => __awaiter(void 0, void 0, void 0, function* () {
    // update database
    const update_status = yield orders_model_1.default.update({ status: status }, {
        where: {
            order_id: order_id,
        },
    });
    // update Shopify
    const order_details = yield axios_1.default
        .get(`https://${STORE}/admin/api/${API_VERSION}/orders/${order_id}.json`, {
        headers: {
            "X-Shopify-Access-Token": ACCESS_TOKEN,
        },
    })
        .then((response) => {
        let order_tags = response.data.order.tags;
        let order_attributes = response.data.order.note_attributes;
        let order_tags_arr = order_tags.split(",");
        order_tags_arr.forEach((tag, i) => {
            if (tag.includes("TS_")) {
                order_tags_arr[i] = status;
            }
        });
        order_tags = order_tags_arr.toString();
        return [order_tags, order_attributes];
    });
    let order_attributes = order_details[1];
    order_attributes.push({ name: "error_id", value: error_id });
    order_attributes.push({ name: "error_name", value: error_name });
    order_attributes.push({ name: "error_note", value: error_note });
    const body = {
        order: {
            id: order_id,
            tags: order_details[0],
            note_attributes: order_attributes,
        },
    };
    const { data } = yield axios_1.default.put(`https://${STORE}/admin/api/${API_VERSION}/orders/${order_id}.json`, body, {
        headers: {
            "X-Shopify-Access-Token": ACCESS_TOKEN,
        },
    });
});
exports.error_status_update = error_status_update;
