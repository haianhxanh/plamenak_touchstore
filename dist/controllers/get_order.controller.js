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
const constants_1 = require("./../utilities/constants");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const orders_model_1 = __importDefault(require("../model/orders.model"));
const constants_2 = require("../utilities/constants");
const status_update_1 = require("../utilities/status_update");
dotenv_1.default.config();
const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;
const ORDER_STATUSES = [
    constants_2.ORDER_STATUS.IN_PROGRESS,
    constants_2.ORDER_STATUS.DOWNLOADED,
    constants_2.ORDER_STATUS.ERROR,
    constants_2.ORDER_STATUS.PACKED,
    constants_2.ORDER_STATUS.FULFILLED,
];
/*-------------------------------------GETTING UNFULFILLED ORDERS------------------------------------------------*/
const get_unfulfilled_orders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let orders_data;
    try {
        /*--------------------------------------FETCHING DATA FROM CUSTOM API------------------------------------------*/
        const { data } = yield axios_1.default.get(`https://${STORE}/admin/api/${API_VERSION}/orders.json?status=open`, {
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": ACCESS_TOKEN,
            },
        });
        /*--------------------------------------FILTERING UNFULFILLED ORDERS-----------------------------------------------*/
        const fetched_data = data.orders;
        const unfulfilled_orders = fetched_data.filter((orders) => {
            if (orders.fulfillment_status != constants_1.SHOPIFY_FULFILLMENT_STATUS.FULFILLED &&
                orders.tags.includes(constants_2.ORDER_STATUS.IN_PROGRESS)) {
                return orders;
            }
        });
        if (unfulfilled_orders.length === 0) {
            const get_data = yield orders_model_1.default.findAll({});
            const total_db_data = get_data.map((db_data) => {
                return db_data.dataValues;
            });
            const total_unfulfilled_data = total_db_data.filter((unfulfilled_data) => ORDER_STATUSES.includes(unfulfilled_data.status) &&
                unfulfilled_data.status != constants_2.ORDER_STATUS.FULFILLED &&
                unfulfilled_data.status != constants_2.ORDER_STATUS.DOWNLOADED);
            if (total_unfulfilled_data.length === 0) {
                return res.status(200).json([]);
            }
            else {
                orders_data = total_unfulfilled_data;
                tagOrdersAsDownloaded();
                return res.status(200).json(total_unfulfilled_data);
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
                    let cash_on_delivery_amount;
                    if (structure.payment_gateway_names[0].includes(constants_2.PAYMENTS.CASH_ON_DELIVERY)) {
                        cash_on_delivery_amount = parseFloat(structure.total_price);
                    }
                    else {
                        cash_on_delivery_amount = 0;
                    }
                    let carrier = ((_a = constants_2.CARRIERS.find((carrier) => s_l.title.includes(carrier.name))) === null || _a === void 0 ? void 0 : _a.carrier) || "cpost";
                    let send_address_id;
                    switch (carrier) {
                        case "cpost":
                            send_address_id = constants_2.STRINGS.CZECH_POST_SENDER_ID;
                            break;
                        case "zasilkovna":
                            send_address_id = constants_2.STRINGS.ZASILKOVNA_SENDER_ID;
                            break;
                        default:
                            send_address_id = null;
                    }
                    let order_name;
                    if (structure.name.includes("#")) {
                        order_name = parseInt(structure.name.split("#")[1]);
                    }
                    else {
                        order_name = parseInt(structure.name);
                    }
                    let carrier_product;
                    carrier_product =
                        ((_b = constants_2.CARRIERS.find((carrier) => s_l.title.includes(carrier.name))) === null || _b === void 0 ? void 0 : _b.carrier_product) || "DR";
                    let branch_id;
                    if (carrier_product == "NB") {
                        branch_id = (_c = structure.note_attributes
                            .find((attr) => attr.name == "PickupPointId")) === null || _c === void 0 ? void 0 : _c.value.substr(-5);
                    }
                    else {
                        branch_id = (_d = structure.note_attributes.find((attr) => attr.name == "PickupPointId")) === null || _d === void 0 ? void 0 : _d.value;
                    }
                    const custom_schema = {
                        order_id: structure.id,
                        carrier: carrier,
                        carrier_product: carrier_product,
                        carrier_branch_id: branch_id,
                        extra_branch_id: branch_id,
                        send_address_id: send_address_id,
                        priority: 4,
                        status: constants_2.ORDER_STATUS.IN_PROGRESS,
                        recipient_name: structure.shipping_address.name,
                        recipient_contact: null,
                        recipient_street: structure.shipping_address.address1,
                        recipient_city: structure.shipping_address.city,
                        recipient_state: recipientState,
                        recipient_zip: structure.shipping_address.zip.replace(" ", ""),
                        recipient_country_code: structure.shipping_address.country_code,
                        recipient_phone: structure.shipping_address.phone
                            ? structure.shipping_address.phone.replace(/ /g, "")
                            : null,
                        recipient_email: structure.customer.email,
                        weight: structure.total_weight
                            ? structure.total_weight / 1000
                            : null,
                        ic: null,
                        dic: null,
                        note: structure.note,
                        driver_note: null,
                        services: carrier == "cpost" ? ["S"] : [],
                        ref: order_name,
                        label: order_name,
                        barcode: order_name,
                        cod_vs: order_name,
                        cod_amount: cash_on_delivery_amount,
                        cod_currency: structure.currency,
                        cod_card_payment: false,
                        ins_amount: parseFloat(structure.total_price),
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
                            if (l_i.title == constants_2.VIRTUAL_PRODUCTS.CASH_ON_DELIVERY) {
                                return;
                            }
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
                if (new_data.length === 0) {
                    const get_data = yield orders_model_1.default.findAll({});
                    const total_db_data = get_data.map((db_data) => {
                        return db_data.dataValues;
                    });
                    /*-----------GETTING ONLY UNFULFILLED STATUS ORDERS AND IN_PROGRESS STATUS ORDERS TO CARRIER PROVIDER------------*/
                    const total_unfulfilled_data = total_db_data.filter((unfulfilled_data) => ORDER_STATUSES.includes(unfulfilled_data.status) &&
                        unfulfilled_data.status != constants_2.ORDER_STATUS.FULFILLED &&
                        unfulfilled_data.status != constants_2.ORDER_STATUS.DOWNLOADED);
                    if (total_unfulfilled_data.length === 0) {
                        return res.status(200).json([]);
                    }
                    else if (total_unfulfilled_data.length > 0) {
                        orders_data = total_unfulfilled_data;
                        tagOrdersAsDownloaded();
                        return res.status(200).json(total_unfulfilled_data);
                    }
                }
                else {
                    yield Promise.all(new_data.map((data) => __awaiter(void 0, void 0, void 0, function* () {
                        const checking_existing_data = yield orders_model_1.default.create({
                            order_id: data.order_id,
                            carrier: data.carrier,
                            carrier_product: data.carrier_product,
                            carrier_branch_id: data.carrier_branch_id,
                            extra_branch_id: data.extra_branch_id,
                            send_address_id: data.send_address_id,
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
                    })));
                    const get_data = yield orders_model_1.default.findAll({});
                    const total_db_data = get_data.map((db_data) => {
                        return db_data.dataValues;
                    });
                    /*-----------GETTING ONLY UNFULFILLED STATUS ORDERS AND IN_PROGRESS STATUS ORDERS TO CARRIER PROVIDER------------*/
                    const total_unfulfilled_data = total_db_data.filter((unfulfilled_data) => ORDER_STATUSES.includes(unfulfilled_data.status) &&
                        unfulfilled_data.status != constants_2.ORDER_STATUS.FULFILLED &&
                        unfulfilled_data.status != constants_2.ORDER_STATUS.DOWNLOADED);
                    if (total_unfulfilled_data.length === 0) {
                        return res.status(200).json([]);
                    }
                    else if (total_unfulfilled_data.length > 0) {
                        orders_data = total_unfulfilled_data;
                        tagOrdersAsDownloaded();
                        return res.status(200).json(total_unfulfilled_data);
                    }
                }
            }
            else {
                yield Promise.all(custom_structure.map((data) => __awaiter(void 0, void 0, void 0, function* () {
                    const checking_existing_data = yield orders_model_1.default.create({
                        order_id: data.order_id,
                        carrier: data.carrier,
                        carrier_product: data.carrier_product,
                        carrier_branch_id: data.carrier_branch_id,
                        extra_branch_id: data.extra_branch_id,
                        send_address_id: data.send_address_id,
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
                })));
                const get_data = yield orders_model_1.default.findAll({});
                const total_db_data = get_data.map((db_data) => {
                    return db_data.dataValues;
                });
                /*-----------GETTING ONLY UNFULFILLED STATUS ORDERS AND IN_PROGRESS STATUS ORDERS TO CARRIER PROVIDER------------*/
                const total_unfulfilled_data = total_db_data.filter((unfulfilled_data) => ORDER_STATUSES.includes(unfulfilled_data.status) &&
                    unfulfilled_data.status != constants_2.ORDER_STATUS.FULFILLED);
                if (total_unfulfilled_data.length === 0) {
                    return res.status(200).json([]);
                }
                else if (total_unfulfilled_data.length > 0) {
                    orders_data = total_unfulfilled_data;
                    tagOrdersAsDownloaded();
                    return res.status(200).json(total_unfulfilled_data);
                }
            }
        }
        // update order status to TS_IN_PROGRESS (bali se)
        function tagOrdersAsDownloaded() {
            let interval = 2500;
            let promise = Promise.resolve();
            let order_ids = [];
            orders_data != undefined &&
                orders_data.map((order) => {
                    if (order.status != constants_2.ORDER_STATUS.IN_PROGRESS) {
                        return;
                    }
                    order_ids.push(order.order_id);
                });
            if (req.query.ts == "1" &&
                orders_data != undefined &&
                order_ids.length > 0) {
                order_ids.forEach((order_id) => {
                    promise = promise.then(function () {
                        (0, status_update_1.status_update)(order_id, constants_2.ORDER_STATUS.DOWNLOADED);
                        return new Promise(function (resolve) {
                            setTimeout(resolve, interval);
                        });
                    });
                });
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
            return res.status(200).json({
                message: `There are no orders data in the database.`,
            });
        }
        else {
            return res.status(200).json(get_data);
        }
    }
    catch (error) {
        console.error("Error all orders from database:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.all_orders = all_orders;
