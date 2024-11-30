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
const dotenv_1 = __importDefault(require("dotenv"));
const orders_model_1 = __importDefault(require("../model/orders.model"));
const constants_1 = require("../utilities/constants");
const status_update_1 = require("../utilities/status_update");
const reusables_1 = require("./reusables");
const sequelize_1 = require("sequelize");
const util_1 = require("util");
const sleep = (0, util_1.promisify)(setTimeout);
dotenv_1.default.config();
/*-------------------------------------GETTING UNFULFILLED ORDERS------------------------------------------------*/
const get_unfulfilled_orders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        /*-------------------------------FETCHING DATA FROM CUSTOM API----------------------------------*/
        let unfulfilled_orders = yield (0, reusables_1.fetch_orders)();
        unfulfilled_orders = unfulfilled_orders.filter((order) => {
            return order.node.shippingAddress != null;
        });
        /*---------------------------------FILTERING UNFULFILLED ORDERS--------------------------------*/
        if (unfulfilled_orders.length === 0) {
            if (req.query.ts != "1") {
                const database_not_fulfilled_orders = yield orders_model_1.default.findAll({
                    where: {
                        status: {
                            [sequelize_1.Op.notIn]: ["TS_FULFILLED"],
                        },
                    },
                });
                return res.status(200).json(database_not_fulfilled_orders);
            }
            else {
                const database_not_fulfilled_or_downloaded_orders = yield orders_model_1.default.findAll({
                    where: {
                        status: {
                            [sequelize_1.Op.notIn]: ["TS_DOWNLOADED", "TS_FULFILLED", "TS_ERROR"],
                        },
                    },
                });
                const database_orders = database_not_fulfilled_or_downloaded_orders.map((order) => {
                    return order.dataValues;
                });
                if (database_orders.length > 0) {
                    for (let order in database_orders) {
                        let order_id = database_orders[order].order_id;
                        const order_status_update = yield (0, status_update_1.status_update)(order_id, constants_1.ORDER_STATUS.DOWNLOADED);
                        yield sleep(1000);
                    }
                    return res
                        .status(200)
                        .json(database_not_fulfilled_or_downloaded_orders);
                }
                else {
                    return res.status(200).json([]);
                }
            }
        }
        else {
            /*----------------------CONVERTING THE STRUCTURE OF THE RECEIVED DATA TO THE CUSTOM DATA STRUCTURE REQUIRED BY THE CARRIER PROVIDER----------------*/
            const custom_structure = [];
            unfulfilled_orders.map((structure) => {
                var _a, _b, _c;
                let recipientState;
                switch (structure.node.shippingAddress.countryCode) {
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
                if ((_a = structure.node) === null || _a === void 0 ? void 0 : _a.paymentGatewayNames[0].includes(constants_1.PAYMENTS.CASH_ON_DELIVERY)) {
                    cash_on_delivery_amount = parseFloat(structure.node.totalPriceSet.shopMoney.amount).toFixed(2);
                }
                else {
                    cash_on_delivery_amount = 0;
                }
                let carrier = constants_1.CARRIERS.find((carrier) => { var _a, _b; return (_b = (_a = structure.node) === null || _a === void 0 ? void 0 : _a.shippingLine) === null || _b === void 0 ? void 0 : _b.title.includes(carrier.name); }) || constants_1.CARRIERS[0];
                let send_address_id = carrier === null || carrier === void 0 ? void 0 : carrier.sender_id;
                let carrier_product = carrier === null || carrier === void 0 ? void 0 : carrier.product;
                let order_name;
                if (structure.node.name.includes("#")) {
                    order_name = parseInt(structure.node.name.split("#")[1]);
                }
                else {
                    order_name = parseInt(structure.node.name);
                }
                let branch_id;
                if ((carrier === null || carrier === void 0 ? void 0 : carrier.product) == "NB") {
                    branch_id = (_b = structure.node.customAttributes
                        .find((attr) => attr.key == "PickupPointId")) === null || _b === void 0 ? void 0 : _b.value.substr(-5);
                }
                else {
                    branch_id = (_c = structure.node.customAttributes.find((attr) => attr.key == "PickupPointId")) === null || _c === void 0 ? void 0 : _c.value;
                }
                const custom_schema = {
                    order_id: structure.node.id.replace("gid://shopify/Order/", ""),
                    carrier: carrier === null || carrier === void 0 ? void 0 : carrier.ts_name,
                    carrier_product: carrier_product,
                    carrier_branch_id: branch_id !== "" ? branch_id : null,
                    extra_branch_id: branch_id,
                    send_address_id: send_address_id,
                    priority: 4,
                    status: constants_1.ORDER_STATUS.IN_PROGRESS,
                    recipient_name: structure.node.shippingAddress.name,
                    recipient_contact: null,
                    recipient_street: structure.node.shippingAddress.address1,
                    recipient_city: structure.node.shippingAddress.city,
                    recipient_state: recipientState,
                    recipient_zip: structure.node.shippingAddress.zip.replace(" ", ""),
                    recipient_country_code: structure.node.shippingAddress.countryCode,
                    recipient_phone: structure.node.shippingAddress.phone
                        ? structure.node.shippingAddress.phone.replace(/ /g, "")
                        : null,
                    recipient_email: structure.node.customer.email,
                    weight: structure.node.totalWeight
                        ? structure.node.totalWeight / 1000
                        : null,
                    ic: null,
                    dic: null,
                    note: cash_on_delivery_amount > 0 ? "Dobírka" : null,
                    driver_note: null,
                    services: [],
                    ref: order_name,
                    label: order_name,
                    barcode: order_name,
                    cod_vs: order_name,
                    cod_amount: cash_on_delivery_amount,
                    cod_currency: structure.node.totalPriceSet.shopMoney.currencyCode,
                    cod_card_payment: false,
                    ins_amount: Math.ceil(parseFloat(structure.node.totalPriceSet.shopMoney.amount)),
                    ins_currency: structure.node.totalPriceSet.shopMoney.currencyCode,
                    date_delivery: null,
                    date_source: new Date().toISOString().split(".")[0],
                    products: [],
                };
                if (custom_schema.carrier_product == "DR") {
                    custom_structure.push(custom_schema);
                }
                else {
                    if (custom_schema.carrier_branch_id != null) {
                        custom_structure.push(custom_schema);
                    }
                }
            });
            unfulfilled_orders.map((structure) => {
                custom_structure.map((struct) => {
                    if (structure.node.id.replace("gid://shopify/Order/", "") ==
                        struct.order_id) {
                        structure.node.lineItems.edges.map((item) => {
                            var _a;
                            if (item.title == constants_1.VIRTUAL_PRODUCTS.CASH_ON_DELIVERY) {
                                return;
                            }
                            const product_order = {
                                item_id: item.node.id.replace("gid://shopify/LineItem/", ""),
                                sku: struct.ref.toString() || null,
                                name: item.node.title,
                                ean: null,
                                qty: item.node.quantity,
                                image_url: ((_a = item.node.image) === null || _a === void 0 ? void 0 : _a.url) || null,
                                unit: "ks",
                                location: null,
                                note: null,
                            };
                            struct.products.push(product_order);
                        });
                    }
                });
            });
            /*---------------REGISTERING CONVERTED DATA INTO THE DATABASE------------------*/
            let order_status = req.query.ts == "1"
                ? constants_1.ORDER_STATUS.DOWNLOADED
                : constants_1.ORDER_STATUS.IN_PROGRESS;
            for (const structure of custom_structure) {
                const existing_order = yield orders_model_1.default.findOne({
                    where: { order_id: structure.order_id },
                });
                if (!existing_order) {
                    try {
                        const database_order = yield orders_model_1.default.create(structure);
                    }
                    catch (error) {
                        console.error("Error creating order in database:", error);
                    }
                }
                else {
                    yield orders_model_1.default.update(structure, {
                        where: { order_id: structure.order_id },
                    });
                }
                yield (0, status_update_1.status_update)(structure.order_id, order_status);
                yield sleep(1000);
            }
            console.log("custom_structure", custom_structure);
            return res.status(200).json(custom_structure);
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
