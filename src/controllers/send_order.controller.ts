import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import Orders from "../model/orders.model";
import { validate_order_id } from "../utilities/input_validation";
import { CARRIERS, ORDER_STATUS } from "../utilities/constants";
import { promisify } from "util";
const sleep = promisify(setTimeout);
dotenv.config();
const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;

type InternalFulfillmentResponse = {
  order_id: number | string;
  status: string;
};

export const send_order = async (req: Request, res: Response) => {
  try {
    /*------------------VALIDATING THE NEEDED INPUT DATA FOR THE PROGRAM-------------------------*/

    const consignments = req.body.consignments;

    const internal_fullfillment_response = [] as InternalFulfillmentResponse[];

    for (const consignment of consignments) {
      try {
        const { data } = await axios.get(
          `https://${STORE}/admin/api/${API_VERSION}/orders/${consignment.order_id}/fulfillment_orders.json`,
          {
            headers: {
              "X-Shopify-Access-Token": ACCESS_TOKEN!,
            },
          }
        );

        if (data.fulfillment_orders[0].status == "closed") {
          const update_status = await Orders.update(
            { status: ORDER_STATUS.FULFILLED },
            {
              where: {
                order_id: +consignment.order_id,
              },
            }
          );

          let message =
            "Order was already fulfilled and cannot be fulfilled again";
          internal_fullfillment_response.push({
            order_id: consignment.order_id,
            status: message,
          });
        } else {
          try {
            data.fulfillment_orders.map(async (order: any) => {
              const order_fullfilment_id =
                order.line_items[0].fulfillment_order_id;
              const order_line_items = order.line_items.map((item: any) => {
                return { id: item.id, quantity: item.quantity };
              });

              /*------------------------------------------------------CREATE FULFILLMENT---------------------------------------------------------------*/

              const carrier = CARRIERS.find(
                (carrier) => carrier.carrier_product == consignment.product
              );

              const create_fulfillment = {
                fulfillment: {
                  line_items_by_fulfillment_order: [
                    {
                      fulfillment_order_id: order_fullfilment_id,
                      fulfillment_order_line_items: order_line_items,
                    },
                  ],
                  notify_customer: true,
                  tracking_info: {
                    company: carrier?.carrier_product_name || "",
                    number: consignment.track_ids[0] || "",
                    url: carrier?.tracking_url + consignment.track_ids[0] || "",
                  },
                },
              };

              const create_fulfillment_res: any = await axios.post(
                `https://${STORE}/admin/api/${API_VERSION}/fulfillments.json`,
                create_fulfillment,
                {
                  headers: {
                    "X-Shopify-Access-Token": ACCESS_TOKEN!,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (create_fulfillment_res.status === 201) {
                /*----------------------UPDATE DATABASE--------------------*/

                internal_fullfillment_response.push({
                  order_id: consignment.order_id,
                  status: "Order fulfilled",
                });

                const update_status = await Orders.update(
                  { status: ORDER_STATUS.FULFILLED },
                  {
                    where: {
                      order_id: +consignment.order_id,
                    },
                  }
                );
              }
            });
          } catch (error) {
            console.error("Error mapping an order", error);
          }
        }
      } catch (error) {
        console.error("Error getting unfulfilled order", error);
      }
      await sleep(500);
    }

    return res.status(200).json(internal_fullfillment_response);
  } catch (error) {
    console.error("Error updating status for unfulfilled_orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
