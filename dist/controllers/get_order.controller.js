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
exports.all_orders = exports.get_unfulfilled_orders = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const orders_model_1 = __importDefault(require("../model/orders.model"));
const uuid_1 = require("uuid");
const constants_1 = require("../utilities/constants");
dotenv_1.default.config();
const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;
/*-------------------------------------GETTING UNFULFILLED ORDERS------------------------------------------------*/
const get_unfulfilled_orders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        /*--------------------------------------FETCHING DATA FROM CUSTOM API------------------------------------------*/
        const { data } = yield axios_1.default.get(`https://${STORE}/admin/api/${API_VERSION}/orders.json?tag=TS_IN_PROGRESS`, {
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": ACCESS_TOKEN,
            },
        });
        /*--------------------------------------FILTERING UNFULFILLED ORDERS-----------------------------------------------*/
        const fetched_data = data.orders;
        const unfulfilled_orders = fetched_data.filter((orders) => {
            if (orders.fulfillment_status === null ||
                orders.fulfillment_status === "partial") {
                return orders;
            }
        });
        if (unfulfilled_orders.length === 0) {
            const get_data = yield orders_model_1.default.findAll({});
            const total_db_data = get_data.map((db_data) => {
                return db_data.dataValues;
            });
            const total_unfulfilled_data = total_db_data.filter((unfulfilled_data) => unfulfilled_data.status === constants_1.ORDER_STATUS.IN_PROGRESS);
            if (total_unfulfilled_data.length === 0) {
                res.status(200).json({
                    message: `NO UNFULFILLED ORDERS`,
                });
            }
            else {
                res.status(200).json(total_unfulfilled_data);
            }
        }
        else {
            /*----------------------CONVERTING THE STRUCTURE OF THE RECEIVED DATA TO THE CUSTOM DATA STRUCTURE REQUIRED BY THE CARRIER PROVIDER----------------*/
            const custom_structure = [];
            unfulfilled_orders.map((structure) => {
                structure.shipping_lines.map((s_l) => {
                    var _a, _b, _c, _d;
                    let recipientState;
                    switch (structure.shipping_address.country.code) {
                        case "CA":
                            recipientState = "CA";
                            break;
                        case "US":
                            recipientState = "US";
                            break;
                        case "RO":
                            recipientState = "RO";
                            break;
                        default:
                            recipientState = "";
                    }
                    const custom_schema = {
                        order_id: structure.id,
                        carrier: (_a = constants_1.CARRIERS.find((carrier) => carrier.name == s_l.title)) === null || _a === void 0 ? void 0 : _a.carrier,
                        carrier_product: (_b = constants_1.CARRIERS.find((carrier) => carrier.name == s_l.title)) === null || _b === void 0 ? void 0 : _b.carrier_product,
                        carrier_branch_id: (_c = structure.note_attributes.find((attr) => attr.name == "PickupPointId")) === null || _c === void 0 ? void 0 : _c.value,
                        extra_branch_id: (_d = structure.note_attributes.find((attr) => attr.name == "PickupPointId")) === null || _d === void 0 ? void 0 : _d.value,
                        priority: 4,
                        status: "TS_IN_PROGRESS",
                        recipient_name: structure.shipping_address.name,
                        recipient_contact: structure.shipping_address.name,
                        recipient_street: structure.shipping_address.address1,
                        recipient_city: structure.shipping_address.city,
                        recipient_state: recipientState,
                        recipient_zip: structure.shipping_address.zip.replace(" ", ""),
                        recipient_country_code: structure.shipping_address.country_code,
                        recipient_phone: structure.shipping_address.phone,
                        recipient_email: structure.customer.email,
                        weight: structure.total_weight / 1000,
                        ic: null,
                        dic: null,
                        note: structure.note,
                        driver_note: null,
                        services: [],
                        ref: structure.order_number,
                        label: structure.order_number,
                        barcode: structure.order_number,
                        cod_vs: structure.order_number,
                        cod_amount: 0,
                        cod_currency: structure.currency,
                        cod_card_payment: false,
                        ins_amount: parseInt(structure.total_price),
                        ins_currency: structure.currency,
                        date_delivery: null,
                        date_source: new Date().toISOString().split(".")[0],
                        products: [],
                    };
                    custom_structure.push(custom_schema);
                });
            });
            unfulfilled_orders.map((structure) => {
                custom_structure.map((struct) => {
                    if (structure.id === struct.order_id) {
                        structure.line_items.map((l_i) => {
                            const product_order = {
                                item_id: l_i.id,
                                sku: l_i.sku,
                                name: l_i.title,
                                ean: null,
                                qty: l_i.quantity,
                                image_url: null,
                                unit: "ks",
                                location: null,
                                note: null,
                            };
                            struct.products.push(product_order);
                        });
                    }
                });
            });
            /*-----------------------------------------REGISTERING CONVERTED DATA INTO THE DATABASE------------------------------------------*/
            /*------READING THE DATABASE TO GET ALL ORDERS--------*/
            const checking_existing_data = yield orders_model_1.default.findAll({});
            const result = checking_existing_data.map((ex_data) => {
                return ex_data.dataValues;
            });
            if (result.length > 0) {
                /*------CHECKING IF ANY OF THE INCOMING DATA ARE ALREADY STORED AND THEN STORE ONLY UNIQUE DATA-------*/
                const prev_data = result.map((prev_info) => {
                    return prev_info.order_id.toString();
                });
                const present_data = custom_structure.map((incoming_data) => {
                    return incoming_data.order_id.toString();
                });
                const recent_data = present_data.filter((data) => !prev_data.includes(data));
                const new_data = [];
                recent_data.map((new_input) => {
                    custom_structure.map((all_data) => {
                        if (+new_input === +all_data.order_id) {
                            new_data.push(all_data);
                        }
                    });
                });
                console.log(present_data);
                if (new_data.length === 0) {
                    const get_data = yield orders_model_1.default.findAll({});
                    const total_db_data = get_data.map((db_data) => {
                        return db_data.dataValues;
                    });
                    /*-----------GETTING ONLY UNFULFILLED STATUS ORDERS AND IN_PROGRESS STATUS ORDERS TO CARRIER PROVIDER------------*/
                    const total_unfulfilled_data = total_db_data.filter((unfulfilled_data) => unfulfilled_data.status === constants_1.ORDER_STATUS.IN_PROGRESS);
                    if (total_unfulfilled_data.length === 0) {
                        res.status(200).json({
                            message: `ALL ORDERS HAS BEEN FULFILLED`,
                        });
                    }
                    else if (total_unfulfilled_data.length > 0) {
                        res.status(200).json(total_unfulfilled_data);
                    }
                }
                else {
                    new_data.map((data) => __awaiter(void 0, void 0, void 0, function* () {
                        const checking_existing_data = yield orders_model_1.default.create({
                            id: (0, uuid_1.v4)(),
                            order_id: data.order_id,
                            carrier: data.carrier,
                            carrier_product: data.carrier_product,
                            carrier_branch_id: data.carrier_branch_id,
                            extra_branch_id: data.extra_branch_id,
                            priority: data.priority,
                            status: data.status,
                            recipient_name: data.recipient_name,
                            recipient_contact: data.recipient_contact,
                            recipient_street: data.recipient_street,
                            recipient_city: data.recipient_city,
                            recipient_state: data.recipient_state,
                            recipient_zip: data.recipient_zip,
                            recipient_country_code: data.recipient_country_code,
                            recipient_phone: data.recipient_phone,
                            recipient_email: data.recipient_email,
                            weight: data.weight,
                            ic: data.ic,
                            dic: data.dic,
                            note: data.note,
                            driver_note: data.driver_note,
                            services: data.services,
                            ref: data.ref,
                            label: data.label,
                            barcode: data.barcode,
                            cod_vs: data.cod_vs,
                            cod_amount: data.cod_amount,
                            cod_currency: data.cod_currency,
                            cod_card_payment: data.cod_card_payment,
                            ins_amount: data.ins_amount,
                            ins_currency: data.ins_currency,
                            date_delivery: data.date_delivery,
                            date_source: data.date_source,
                            products: data.products,
                        });
                        const get_data = yield orders_model_1.default.findAll({});
                        const total_db_data = get_data.map((db_data) => {
                            return db_data.dataValues;
                        });
                        /*-----------GETTING ONLY UNFULFILLED STATUS ORDERS AND IN_PROGRESS STATUS ORDERS TO CARRIER PROVIDER------------*/
                        const total_unfulfilled_data = total_db_data.filter((unfulfilled_data) => unfulfilled_data.status === constants_1.ORDER_STATUS.IN_PROGRESS);
                        if (total_unfulfilled_data.length === 0) {
                            res.status(200).json({
                                message: `ALL ORDERS HAS BEEN FULFILLED`,
                            });
                        }
                        else if (total_unfulfilled_data.length > 0) {
                            res.status(200).json(total_unfulfilled_data);
                        }
                    }));
                }
            }
            else {
                custom_structure.map((data) => __awaiter(void 0, void 0, void 0, function* () {
                    const checking_existing_data = yield orders_model_1.default.create({
                        id: (0, uuid_1.v4)(),
                        order_id: data.order_id,
                        carrier: data.carrier,
                        carrier_product: data.carrier_product,
                        carrier_branch_id: data.carrier_branch_id,
                        extra_branch_id: data.extra_branch_id,
                        priority: data.priority,
                        status: data.status,
                        recipient_name: data.recipient_name,
                        recipient_contact: data.recipient_contact,
                        recipient_street: data.recipient_street,
                        recipient_city: data.recipient_city,
                        recipient_state: data.recipient_state,
                        recipient_zip: data.recipient_zip,
                        recipient_country_code: data.recipient_country_code,
                        recipient_phone: data.recipient_phone,
                        recipient_email: data.recipient_email,
                        weight: data.weight,
                        ic: data.ic,
                        dic: data.dic,
                        note: data.note,
                        driver_note: data.driver_note,
                        services: data.services,
                        ref: data.ref,
                        label: data.label,
                        barcode: data.barcode,
                        cod_vs: data.cod_vs,
                        cod_amount: data.cod_amount,
                        cod_currency: data.cod_currency,
                        cod_card_payment: data.cod_card_payment,
                        ins_amount: data.ins_amount,
                        ins_currency: data.ins_currency,
                        date_delivery: data.date_delivery,
                        date_source: data.date_source,
                        products: data.products,
                    });
                    const get_data = yield orders_model_1.default.findAll({});
                    const total_db_data = get_data.map((db_data) => {
                        return db_data.dataValues;
                    });
                    /*-----------GETTING ONLY UNFULFILLED STATUS ORDERS AND IN_PROGRESS STATUS ORDERS TO CARRIER PROVIDER------------*/
                    const total_unfulfilled_data = total_db_data.filter((unfulfilled_data) => unfulfilled_data.status === constants_1.ORDER_STATUS.IN_PROGRESS);
                    if (total_unfulfilled_data.length === 0) {
                        res.status(200).json({
                            message: `ALL ORDERS HAS BEEN FULFILLED`,
                        });
                    }
                    else if (total_unfulfilled_data.length > 0) {
                        res.status(200).json(total_unfulfilled_data);
                    }
                }));
            }
        }
    }
    catch (error) {
        console.error("Error getting unfulfilled_orders:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.get_unfulfilled_orders = get_unfulfilled_orders;
/*-------------------------------------GETTING ALL ORDERS IN THE DATABASE------------------------------------------------*/
const all_orders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const get_data = yield orders_model_1.default.findAll({});
        const total_db_data = get_data.map((db_data) => {
            return db_data.dataValues;
        });
        if (total_db_data.length === 0) {
            res.status(400).json({
                message: `There are no orders data in the database.`,
            });
        }
        else {
            res.status(200).json(get_data);
        }
    }
    catch (error) {
        console.error("Error all orders from database:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.all_orders = all_orders;
