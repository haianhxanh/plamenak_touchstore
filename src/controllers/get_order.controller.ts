import { Request, Response } from "express";
import dotenv from "dotenv";
import Orders from "../model/orders.model";
import {
  ORDER_STATUS,
  CARRIERS,
  PAYMENTS,
  VIRTUAL_PRODUCTS,
} from "../utilities/constants";
import { status_update } from "../utilities/status_update";
import { fetch_orders } from "./reusables";
import { Op } from "sequelize";
import { promisify } from "util";
const sleep = promisify(setTimeout);

dotenv.config();

/*-------------------------------------GETTING UNFULFILLED ORDERS------------------------------------------------*/

export const get_unfulfilled_orders = async (req: Request, res: Response) => {
  let orders_data: any;

  try {
    /*-------------------------------FETCHING DATA FROM CUSTOM API----------------------------------*/

    let unfulfilled_orders = await fetch_orders();

    /*---------------------------------FILTERING UNFULFILLED ORDERS--------------------------------*/

    if (unfulfilled_orders.length === 0) {
      if (req.query.ts != "1") {
        const database_not_fulfilled_orders = await Orders.findAll({
          where: {
            status: {
              [Op.notIn]: ["TS_FULFILLED"],
            },
          },
        });

        return res.status(200).json(database_not_fulfilled_orders);
      } else {
        const database_not_fulfilled_or_downloaded_orders =
          await Orders.findAll({
            where: {
              status: {
                [Op.notIn]: ["TS_DOWNLOADED", "TS_FULFILLED", "TS_ERROR"],
              },
            },
          });
        const database_orders = database_not_fulfilled_or_downloaded_orders.map(
          (order: any) => {
            return order.dataValues;
          }
        );

        if (database_orders.length > 0) {
          for (let order in database_orders) {
            let order_id = database_orders[order].order_id;
            const order_status_update = await status_update(
              order_id,
              ORDER_STATUS.DOWNLOADED
            );
            await sleep(1000);
          }
          return res
            .status(200)
            .json(database_not_fulfilled_or_downloaded_orders);
        } else {
          return res.status(200).json([]);
        }
      }
    } else {
      /*----------------------CONVERTING THE STRUCTURE OF THE RECEIVED DATA TO THE CUSTOM DATA STRUCTURE REQUIRED BY THE CARRIER PROVIDER----------------*/

      const custom_structure: any = [];
      unfulfilled_orders.map((structure: any) => {
        let recipientState: any;
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

        let cash_on_delivery_amount: any;
        if (
          structure.node?.paymentGatewayNames[0].includes(
            PAYMENTS.CASH_ON_DELIVERY
          )
        ) {
          cash_on_delivery_amount = parseFloat(
            structure.node.totalPriceSet.shopMoney.amount
          ).toFixed(2);
        } else {
          cash_on_delivery_amount = 0;
        }

        let carrier: any =
          CARRIERS.find((carrier) =>
            structure.node?.shippingLine?.title.includes(carrier.name)
          ) || CARRIERS[0];

        let send_address_id = carrier?.sender_id;
        let carrier_product = carrier?.product;

        let order_name: any;
        if (structure.node.name.includes("#")) {
          order_name = parseInt(structure.node.name.split("#")[1]);
        } else {
          order_name = parseInt(structure.node.name);
        }

        let branch_id: any;
        if (carrier?.product == "NB") {
          branch_id = structure.node.customAttributes
            .find((attr: any) => attr.name == "PickupPointId")
            ?.value.substr(-5);
        } else {
          branch_id = structure.node.customAttributes.find(
            (attr: any) => attr.name == "PickupPointId"
          )?.value;
        }

        const custom_schema = {
          order_id: structure.node.id.replace("gid://shopify/Order/", ""),
          carrier: carrier?.ts_name,
          carrier_product: carrier_product,
          carrier_branch_id: branch_id,
          extra_branch_id: branch_id,
          send_address_id: send_address_id,
          priority: 4,
          status: ORDER_STATUS.IN_PROGRESS,
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
          ins_amount: Math.ceil(
            parseFloat(structure.node.totalPriceSet.shopMoney.amount)
          ),
          ins_currency: structure.node.totalPriceSet.shopMoney.currencyCode,
          date_delivery: null,
          date_source: new Date().toISOString().split(".")[0],
          products: [],
        };
        custom_structure.push(custom_schema);
      });

      unfulfilled_orders.map((structure: any) => {
        custom_structure.map((struct: any) => {
          if (
            structure.node.id.replace("gid://shopify/Order/", "") ==
            struct.order_id
          ) {
            structure.node.lineItems.edges.map((item: any) => {
              if (item.title == VIRTUAL_PRODUCTS.CASH_ON_DELIVERY) {
                return;
              }
              const product_order = {
                item_id: item.node.id.replace("gid://shopify/LineItem/", ""),
                sku: struct.ref.toString() || null,
                name: item.node.title,
                ean: null,
                qty: item.node.quantity,
                image_url: item.node.image?.url || null,
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
      let order_status =
        req.query.ts == "1"
          ? ORDER_STATUS.DOWNLOADED
          : ORDER_STATUS.IN_PROGRESS;

      for (const structure of custom_structure) {
        const existing_order = await Orders.findOne({
          where: { order_id: structure.order_id },
        });

        if (!existing_order) {
          try {
            const database_order = await Orders.create(structure);
          } catch (error) {
            console.error("Error creating order in database:", error);
          }
        } else {
          await Orders.update(structure, {
            where: { order_id: structure.order_id },
          });
        }
        await status_update(structure.order_id, order_status);
        await sleep(1000);
      }

      return res.status(200).json(custom_structure);
    }
  } catch (error) {
    console.error("Error getting unfulfilled_orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/*-------------------------------------GETTING ALL ORDERS IN THE DATABASE------------------------------------------------*/

export const all_orders = async (req: Request, res: Response) => {
  try {
    const get_data: any = await Orders.findAll({});
    const total_db_data = get_data.map((db_data: any) => {
      return db_data.dataValues;
    });

    if (total_db_data.length === 0) {
      return res.status(200).json({
        message: `There are no orders data in the database.`,
      });
    } else {
      return res.status(200).json(get_data);
    }
  } catch (error) {
    console.error("Error all orders from database:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
