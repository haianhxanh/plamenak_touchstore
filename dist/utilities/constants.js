"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRINGS = exports.VIRTUAL_PRODUCTS = exports.PAYMENTS = exports.CARRIERS = exports.UNFULFILLED_ORDER_STATUS = exports.ORDER_STATUS = void 0;
exports.ORDER_STATUS = {
    IN_PROGRESS: "TS_IN_PROGRESS",
    DOWNLOADED: "TS_DOWNLOADED",
    ERROR: "TS_ERROR",
    PACKED: "TS_PACKED",
    FULFILLED: "TS_FULFILLED",
};
exports.UNFULFILLED_ORDER_STATUS = {
    IN_PROGRESS: "TS_IN_PROGRESS",
    DOWNLOADED: "TS_DOWNLOADED",
    ERROR: "TS_ERROR",
    PACKED: "TS_PACKED",
};
exports.CARRIERS = [
    {
        name: "Doručení na adresu - GLS",
        carrier: "gls",
        carrier_product: "business",
    },
    {
        name: "Doručenie na adresu - GLS",
        carrier: "gls-sk",
        carrier_product: "business",
    },
    {
        name: "Balíkovna - Výdejní místo vyberete po dokončení objednávky",
        carrier: "cpost",
        carrier_product: "NB",
    },
    {
        name: "Česká Pošta - Doručení na adresu (Balík do ruky)",
        carrier: "cpost",
        carrier_product: "DR",
    },
    {
        name: "Zásilkovna - Pobočku vyberete po dokončení objednávky",
        carrier: "zasilkovna",
        carrier_product: "place",
    },
];
exports.PAYMENTS = {
    CASH_ON_DELIVERY: "Platba při převzetí",
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
