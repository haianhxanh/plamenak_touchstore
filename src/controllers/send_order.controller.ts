import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import Orders from "../model/orders.model";
import { validate_order_id } from "../utilities/input_validation";
import { ORDER_STATUS } from "../utilities/constants";

dotenv.config();
const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;

export const send_order = async (req: Request, res: Response) => {
  try {
    /*------------------VALIDATING THE NEEDED INPUT DATA FOR THE PROGRAM-------------------------*/

    if (!req.body.consignments[0].order_id) {
      return res.status(400).json({ message: "Order_id is required" });
    }

    const valid_order_id = req.body.consignments[0].order_id;
    // let tracking_number = req.body.consignments[0].track_ids[0];

    /*-----------UPDATING THE FULFILLMENT STATUS FOR ORDERS ON SHOPIFY----------------------*/

    /*------------------Get list of fulfillment orders------------------------*/
    const order_tags = await axios
      .get(
        `https://${STORE}/admin/api/${API_VERSION}/orders/${valid_order_id}.json`,
        {
          headers: {
            "X-Shopify-Access-Token": ACCESS_TOKEN!,
          },
        }
      )
      .then((response) => {
        let order_tags = response.data.order.tags;
        let order_tags_arr = order_tags.split(",");
        order_tags_arr.forEach((tag: any, i: any) => {
          if (tag.includes("TS_")) {
            order_tags_arr[i] = ORDER_STATUS.FULFILLED;
          }
        });
        order_tags = order_tags_arr.toString();
        return order_tags;
      });

    const body = {
      order: {
        id: valid_order_id,
        tags: order_tags,
      },
    };

    axios.put(
      `https://${STORE}/admin/api/${API_VERSION}/orders/${valid_order_id}.json`,
      body,
      {
        headers: {
          "X-Shopify-Access-Token": ACCESS_TOKEN!,
        },
      }
    );

    try {
      const { data } = await axios.get(
        `https://${STORE}/admin/api/${API_VERSION}/orders/${valid_order_id}/fulfillment_orders.json`,
        {
          headers: {
            "X-Shopify-Access-Token": ACCESS_TOKEN!,
          },
        }
      );

      if (data.fulfillment_orders[0].status == "closed") {
        /*--------------------------------UPDATE DATABASE---------------------------------------------*/

        const update_status = await Orders.update(
          { status: ORDER_STATUS.FULFILLED },
          {
            where: {
              order_id: +valid_order_id,
            },
          }
        );
        return res.status(400).json({
          message: "Order was already fulfilled, database updated accordingly",
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

            const create_fulfillment = {
              fulfillment: {
                line_items_by_fulfillment_order: [
                  {
                    fulfillment_order_id: order_fullfilment_id,
                    fulfillment_order_line_items: order_line_items,
                  },
                ],
                notify_customer: true,
                // tracking_info: {
                //   number: tracking_number,
                // },
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
              /*--------------------------------UPDATE DATABASE---------------------------------------------*/

              const update_status = await Orders.update(
                { status: ORDER_STATUS.FULFILLED },
                {
                  where: {
                    order_id: +valid_order_id,
                  },
                }
              );
            }

            res.status(200).json({
              message: `Status for order with ID - ${valid_order_id} is now updated to FULFILLED`,
            });
          });
        } catch (error) {
          console.error("Error mapping an order", error);
          return res.status(500).json({ error: "Internal server error" });
        }
      }
    } catch (error) {
      console.error("Error getting unfulfilled order", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } catch (error) {
    console.error("Error updating status for unfulfilled_orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
