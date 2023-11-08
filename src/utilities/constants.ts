export const ORDER_STATUS = {
  IN_PROGRESS: "TS_IN_PROGRESS",
  DOWNLOADED: "TS_DOWNLOADED",
  ERROR: "TS_ERROR",
  PACKED: "TS_PACKED",
  FULFILLED: "TS_FULFILLED",
};

export const UNFULFILLED_ORDER_STATUS = {
  IN_PROGRESS: "TS_IN_PROGRESS",
  DOWNLOADED: "TS_DOWNLOADED",
  ERROR: "TS_ERROR",
  PACKED: "TS_PACKED",
};

export const CARRIERS = [
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

export const PAYMENTS = {
  CASH_ON_DELIVERY: "Platba při převzetí",
};

export const VIRTUAL_PRODUCTS = {
  CASH_ON_DELIVERY: "Platba na dobírku",
};
