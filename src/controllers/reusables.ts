import axios from "axios";
const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;
import { PAYMENT_STATUSES, PAYMENTS } from "../utilities/constants";

export const fetch_orders = async () => {
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

  const { data } = await axios.post(
    `https://${STORE}/admin/api/${API_VERSION}/graphql.json`,
    {
      query,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ACCESS_TOKEN!,
      },
    }
  );

  console.log("unfulfilled orders", data.data.orders.edges.length);

  if (!data.data.orders.edges.length) return [];

  let orders: any = [];

  for (const [index, order] of data.data.orders.edges.entries()) {
    if (order.node.displayFinancialStatus != PAYMENT_STATUSES.PAID) {
      // if not paid, only allow those with COD
      if (
        order.node.paymentGatewayNames[0]
          ?.toLowerCase()
          .includes(PAYMENTS.CASH_ON_DELIVERY.toLowerCase())
      ) {
        orders.push(order);
      }
    } else {
      orders.push(order);
    }
  }
  return orders;
};
