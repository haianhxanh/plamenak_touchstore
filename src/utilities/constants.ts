export const ORDER_STATUS = {
  IN_PROGRESS: "TS_IN_PROGRESS",
  DOWNLOADED: "TS_DOWNLOADED",
  ERROR: "TS_ERROR",
  PACKED: "TS_PACKED",
  FULFILLED: "TS_FULFILLED",
};

export const SHOPIFY_FULFILLMENT_STATUS = {
  FULFILLED: "fulfilled",
};

export const UNFULFILLED_ORDER_STATUS = {
  IN_PROGRESS: "TS_IN_PROGRESS",
  DOWNLOADED: "TS_DOWNLOADED",
  ERROR: "TS_ERROR",
  PACKED: "TS_PACKED",
};

export const CARRIERS = [
  {
    name: "Balíkovna",
    carrier: "cpost",
    carrier_product: "NB",
    carrier_product_name: "Balíkovna",
    tracking_url:
      "https://www.postaonline.cz/en/trackandtrace/-/zasilka/cislo?parcelNumbers=",
  },
  {
    name: "Česká Pošta - Doručení na adresu",
    carrier: "cpost",
    carrier_product: "DR",
    carrier_product_name: "Česká Pošta",
    tracking_url:
      "https://www.postaonline.cz/en/trackandtrace/-/zasilka/cislo?parcelNumbers=",
  },
  {
    name: "Zásilkovna",
    carrier: "zasilkovna",
    carrier_product: "place",
    carrier_product_name: "Zásilkovna",
    tracking_url: "https://tracking.packeta.com/cs_CZ/?id=",
  },
  {
    name: "Zásilkovna - Pobočku vyberete po dokončení objednávky",
    carrier: "zasilkovna",
    carrier_product: "place",
    carrier_product_name: "Zásilkovna",
    tracking_url: "https://tracking.packeta.com/cs_CZ/?id=",
  },
];

export const PAYMENTS = {
  CASH_ON_DELIVERY: "Platba při převzetí",
};

export const VIRTUAL_PRODUCTS = {
  CASH_ON_DELIVERY: "Platba na dobírku",
};

export const STRINGS = {
  CZECH_POST: "Česká Pošta",
  CZECH_POST_SENDER_ID: "2",
  ZASILKOVNA: "Zásilkovna",
  ZASILKOVNA_SENDER_ID: "Plamenak",
};
