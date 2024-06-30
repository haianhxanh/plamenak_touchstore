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
exports.fetch_orders = void 0;
const axios_1 = __importDefault(require("axios"));
const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;
const constants_1 = require("../utilities/constants");
const fetch_orders = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const query = `
    query GetOrders {
      orders(
        query: "tag_not:'TS_IN_PROGRESS' AND tag_not:'TS_DOWNLOADED' AND tag_not:'TS_ERROR' AND (tag_not:'zasilkovna_unselected' OR tag_not:'balikovna_unselected') AND fulfillment_status:'unfulfilled' AND NOT financial_status:'voided' AND created_at:>'2024-06-29T22:00:00Z' AND (financial_status:'paid' OR tag:'COD')", 
        first: 100
      ) {
        edges {
          node {
            id
            name
            tags
            displayFulfillmentStatus
            createdAt
            currencyCode
            totalWeight
            note
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            shippingLine {
              title
            }
            displayFinancialStatus
            paymentGatewayNames
            shippingAddress {
              countryCode
              zip
              city
              address1
              phone
              name
            }
            customer {
              email
            }
            customAttributes {
              key
              value
            }
            lineItems(first: 100) {
              edges {
                node {
                  id
                  title
                  quantity
                  sku
                  image {
                    url
                  }
                  customAttributes {
                    key
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
    const { data } = yield axios_1.default.post(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
        query,
    }, {
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": ACCESS_TOKEN,
        },
    });
    if (!data.data.orders.edges.length)
        return [];
    let orders = [];
    for (const [index, order] of data.data.orders.edges.entries()) {
        if (parseInt(order.node.totalWeight) <= 29000) {
            if (order.node.displayFinancialStatus != constants_1.PAYMENT_STATUSES.PAID) {
                // if not paid, only allow those with COD
                if ((_a = order.node.paymentGatewayNames[0]) === null || _a === void 0 ? void 0 : _a.includes(constants_1.PAYMENTS.CASH_ON_DELIVERY)) {
                    orders.push(order);
                }
            }
            else {
                orders.push(order);
            }
        }
    }
    return orders;
});
exports.fetch_orders = fetch_orders;
