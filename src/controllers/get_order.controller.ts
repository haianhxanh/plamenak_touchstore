import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import Orders from "../model/orders.model";
import { v4 } from "uuid";
import {
  ORDER_STATUS,
  CARRIERS,
  PAYMENTS,
  VIRTUAL_PRODUCTS,
} from "../utilities/constants";
import { status_update } from "../utilities/status_update";

dotenv.config();

const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;

const ORDER_STATUSES = [
  ORDER_STATUS.IN_PROGRESS,
  ORDER_STATUS.DOWNLOADED,
  ORDER_STATUS.ERROR,
  ORDER_STATUS.PACKED,
  ORDER_STATUS.FULFILLED,
];

/*-------------------------------------GETTING UNFULFILLED ORDERS------------------------------------------------*/

export const get_unfulfilled_orders = async (req: Request, res: Response) => {
  let orders_data;

  try {
    /*--------------------------------------FETCHING DATA FROM CUSTOM API------------------------------------------*/

    const { data } = await axios.get(
      `https://${STORE}/admin/api/${API_VERSION}/orders.json?tag=${ORDER_STATUS.IN_PROGRESS}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": ACCESS_TOKEN!,
        },
      }
    );

    /*--------------------------------------FILTERING UNFULFILLED ORDERS-----------------------------------------------*/

    const fetched_data = data.orders;
    const unfulfilled_orders: any = fetched_data.filter((orders: any) => {
      if (
        orders.fulfillment_status === null ||
        orders.fulfillment_status === "partial"
      ) {
        return orders;
      }
    });

    if (unfulfilled_orders.length === 0) {
      const get_data: any = await Orders.findAll({});
      const total_db_data = get_data.map((db_data: any) => {
        return db_data.dataValues;
      });

      const total_unfulfilled_data = total_db_data.filter(
        (unfulfilled_data: any) =>
          ORDER_STATUSES.includes(unfulfilled_data.status) &&
          unfulfilled_data.status != ORDER_STATUS.FULFILLED
      );

      if (total_unfulfilled_data.length === 0) {
        res.status(200).json({});
      } else {
        res.status(200).json(total_unfulfilled_data);
        orders_data = total_unfulfilled_data;
      }
    } else {
      /*----------------------CONVERTING THE STRUCTURE OF THE RECEIVED DATA TO THE CUSTOM DATA STRUCTURE REQUIRED BY THE CARRIER PROVIDER----------------*/

      const custom_structure: any = [];
      unfulfilled_orders.map((structure: any) => {
        structure.shipping_lines.map((s_l: any) => {
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
          if (
            structure.payment_gateway_names[0].includes(
              PAYMENTS.CASH_ON_DELIVERY
            )
          ) {
            cash_on_delivery_amount = parseFloat(structure.total_price);
          } else {
            cash_on_delivery_amount = 0;
          }

          const custom_schema = {
            order_id: structure.id,
            carrier: CARRIERS.find((carrier) => carrier.name == s_l.title)
              ?.carrier,
            carrier_product: CARRIERS.find(
              (carrier) => carrier.name == s_l.title
            )?.carrier_product,
            carrier_branch_id: structure.note_attributes.find(
              (attr: any) => attr.name == "PickupPointId"
            )?.value,
            extra_branch_id: structure.note_attributes.find(
              (attr: any) => attr.name == "PickupPointId"
            )?.value,
            priority: 4,
            status: ORDER_STATUS.IN_PROGRESS,
            recipient_name: structure.shipping_address.name,
            recipient_contact: null,
            recipient_street: structure.shipping_address.address1,
            recipient_city: structure.shipping_address.city,
            recipient_state: recipientState,
            recipient_zip: structure.shipping_address.zip.replace(" ", ""),
            recipient_country_code: structure.shipping_address.country_code,
            recipient_phone: structure.shipping_address.phone.replaceAll(
              " ",
              ""
            ),
            recipient_email: structure.customer.email,
            weight: structure.total_weight / 1000,
            ic: null,
            dic: null,
            note: structure.note,
            driver_note: null,
            services: [],
            ref: structure.order_number,
            label: structure.order_number,
            barcode: structure.order_number,
            cod_vs: structure.order_number,
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

      unfulfilled_orders.map((structure: any) => {
        custom_structure.map((struct: any) => {
          if (structure.id === struct.order_id) {
            structure.line_items.map((l_i: any) => {
              if (l_i.title == VIRTUAL_PRODUCTS.CASH_ON_DELIVERY) {
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
      const checking_existing_data: any = await Orders.findAll({});
      const result = checking_existing_data.map((ex_data: any) => {
        return ex_data.dataValues;
      });

      if (result.length > 0) {
        /*------CHECKING IF ANY OF THE INCOMING DATA ARE ALREADY STORED AND THEN STORE ONLY UNIQUE DATA-------*/

        const prev_data = result.map((prev_info: any) => {
          return prev_info.order_id.toString();
        });

        const present_data = custom_structure.map((incoming_data: any) => {
          return incoming_data.order_id.toString();
        });

        const recent_data = present_data.filter(
          (data: any) => !prev_data.includes(data)
        );

        const new_data: any = [];
        recent_data.map((new_input: any) => {
          custom_structure.map((all_data: any) => {
            if (+new_input === +all_data.order_id) {
              new_data.push(all_data);
            }
          });
        });

        if (new_data.length === 0) {
          const get_data: any = await Orders.findAll({});
          const total_db_data = get_data.map((db_data: any) => {
            return db_data.dataValues;
          });

          /*-----------GETTING ONLY UNFULFILLED STATUS ORDERS AND IN_PROGRESS STATUS ORDERS TO CARRIER PROVIDER------------*/
          const total_unfulfilled_data = total_db_data.filter(
            (unfulfilled_data: any) =>
              ORDER_STATUSES.includes(unfulfilled_data.status) &&
              unfulfilled_data.status != ORDER_STATUS.FULFILLED
          );

          if (total_unfulfilled_data.length === 0) {
            res.status(200).json({});
          } else if (total_unfulfilled_data.length > 0) {
            res.status(200).json(total_unfulfilled_data);
            orders_data = total_unfulfilled_data;
          }
        } else {
          new_data.map(async (data: any) => {
            const checking_existing_data = await Orders.create({
              order_id: data.order_id,
              carrier: data.carrier,
              carrier_product: data.carrier_product,
              carrier_branch_id: data.carrier_branch_id,
              extra_branch_id: data.extra_branch_id,
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

            const get_data: any = await Orders.findAll({});
            const total_db_data = get_data.map((db_data: any) => {
              return db_data.dataValues;
            });

            /*-----------GETTING ONLY UNFULFILLED STATUS ORDERS AND IN_PROGRESS STATUS ORDERS TO CARRIER PROVIDER------------*/

            const total_unfulfilled_data = total_db_data.filter(
              (unfulfilled_data: any) =>
                ORDER_STATUSES.includes(unfulfilled_data.status) &&
                unfulfilled_data.status != ORDER_STATUS.FULFILLED
            );

            if (total_unfulfilled_data.length === 0) {
              res.status(200).json({});
            } else if (total_unfulfilled_data.length > 0) {
              res.status(200).json(total_unfulfilled_data);
              orders_data = total_unfulfilled_data;
            }
          });
        }
      } else {
        custom_structure.map(async (data: any) => {
          const checking_existing_data = await Orders.create({
            order_id: data.order_id,
            carrier: data.carrier,
            carrier_product: data.carrier_product,
            carrier_branch_id: data.carrier_branch_id,
            extra_branch_id: data.extra_branch_id,
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

          const get_data: any = await Orders.findAll({});
          const total_db_data = get_data.map((db_data: any) => {
            return db_data.dataValues;
          });

          /*-----------GETTING ONLY UNFULFILLED STATUS ORDERS AND IN_PROGRESS STATUS ORDERS TO CARRIER PROVIDER------------*/
          const total_unfulfilled_data = total_db_data.filter(
            (unfulfilled_data: any) =>
              ORDER_STATUSES.includes(unfulfilled_data.status) &&
              unfulfilled_data.status != ORDER_STATUS.FULFILLED
          );

          if (total_unfulfilled_data.length === 0) {
            res.status(200).json({});
          } else if (total_unfulfilled_data.length > 0) {
            res.status(200).json(total_unfulfilled_data);
            orders_data = total_unfulfilled_data;
          }
        });
      }
    }

    // update order status to TS_IN_PROGRESS (bali se)
    let order_ids: any = [];
    orders_data != undefined &&
      orders_data.map((order: any) => {
        if (order.status != "TS_IN_PROGRESS") {
          return;
        }
        order_ids.push(order.order_id);
      });

    if (
      req.query.ts == "1" &&
      orders_data != undefined &&
      order_ids.length > 0
    ) {
      order_ids.forEach((order_id: string) => {
        status_update(order_id, ORDER_STATUS.DOWNLOADED);
      });
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
      res.status(400).json({
        message: `There are no orders data in the database.`,
      });
    } else {
      res.status(200).json(get_data);
    }
  } catch (error) {
    console.error("Error all orders from database:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
