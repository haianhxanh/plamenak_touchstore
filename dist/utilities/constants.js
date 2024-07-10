"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_STATUSES = exports.STRINGS = exports.VIRTUAL_PRODUCTS = exports.PAYMENTS = exports.CARRIERS = exports.UNFULFILLED_ORDER_STATUS = exports.SHOPIFY_FULFILLMENT_STATUS = exports.ORDER_STATUS = void 0;
exports.ORDER_STATUS = {
    IN_PROGRESS: "TS_IN_PROGRESS",
    DOWNLOADED: "TS_DOWNLOADED",
    ERROR: "TS_ERROR",
    PACKED: "TS_PACKED",
    FULFILLED: "TS_FULFILLED",
    FORCE_SEND: "TS_FORCE_SEND",
};
exports.SHOPIFY_FULFILLMENT_STATUS = {
    FULFILLED: "fulfilled",
};
exports.UNFULFILLED_ORDER_STATUS = {
    IN_PROGRESS: "TS_IN_PROGRESS",
    DOWNLOADED: "TS_DOWNLOADED",
    ERROR: "TS_ERROR",
    PACKED: "TS_PACKED",
};
exports.CARRIERS = [
    {
        name: "Česká Pošta",
        ts_name: "cpost",
        product: "DR",
        carrier_product_name: "Česká Pošta",
        tracking_url: "https://www.postaonline.cz/en/trackandtrace/-/zasilka/cislo?parcelNumbers=",
        sender_id: "2",
    },
    {
        name: "Balíkovna",
        ts_name: "cpost",
        product: "NB",
        carrier_product_name: "Balíkovna",
        tracking_url: "https://www.postaonline.cz/en/trackandtrace/-/zasilka/cislo?parcelNumbers=",
        sender_id: "2",
    },
    {
        name: "Zásilkovna",
        ts_name: "zasilkovna",
        product: "place",
        carrier_product_name: "Zásilkovna",
        tracking_url: "https://tracking.packeta.com/cs_CZ/?id=",
        sender_id: "Plamenak",
    },
];
exports.PAYMENTS = {
    CASH_ON_DELIVERY: "Cash on Delivery (COD)",
};
exports.VIRTUAL_PRODUCTS = {
    CASH_ON_DELIVERY: "Platba na dobírku",
};
exports.STRINGS = {
    CZECH_POST: "Česká Pošta",
    CZECH_POST_SENDER_ID: "2",
    ZASILKOVNA: "Zásilkovna",
    ZASILKOVNA_SENDER_ID: "Plamenak",
};
exports.PAYMENT_STATUSES = {
    PAID: "PAID",
};
