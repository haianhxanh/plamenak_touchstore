"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARRIERS = exports.UNFULFILLED_ORDER_STATUS = exports.ORDER_STATUS = void 0;
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
        name: "Doručení na adresu - Česká pošta",
        carrier: "cpost",
        carrier_product: "DR",
    },
    {
        name: "Zásilkovna - Pobočku vyberete po dokončení objednávky",
        carrier: "zasilkovna",
        carrier_product: "place",
    },
];
