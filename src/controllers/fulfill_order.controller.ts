import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import Orders from "../model/orders.model";
import { validate_order_id } from "../utilities/input_validation";
import { ORDER_STATUS } from "../utilities/constants";

dotenv.config();
const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;

export const fulfill_order = async (req: Request, res: Response) => {
  try {
    /*------------------VALIDATING THE NEEDED INPUT DATA FOR THE PROGRAM-------------------------*/
    let valid_input_id = validate_order_id.validate(req.body.order_id);
    if (valid_input_id.error) {
      const error_message = valid_input_id.error.details[0].message;
      return res.status(400).json({ message: `order_id - ${error_message}` });
    }
    const valid_order_id = valid_input_id.value;

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

    const { data } = await axios.get(
      `https://${STORE}/admin/api/${API_VERSION}/orders/${valid_order_id}/fulfillment_orders.json`,
      {
        headers: {
          "X-Shopify-Access-Token": ACCESS_TOKEN!,
        },
      }
    );

    data.fulfillment_orders.map(async (order: any) => {
      const real_result = order.line_items.map((orders: any) => {
        return { fulfillment_order_id: orders.fulfillment_order_id };
      });

      /*--------------------------------UPDATE DATABASE---------------------------------------------*/

      const update_status = await Orders.update(
        { status: ORDER_STATUS.FULFILLED },
        {
          where: {
            order_id: +valid_order_id,
          },
        }
      );

      if (order.status === "closed") {
        res.status(200).json({
          message: `Fulfillment order ${order.id} has an unfulfillable status= closed.`,
        });
      } else {
        /*------------------------------------------------------CREATE FULFILLMENT---------------------------------------------------------------*/

        const create_fulfillment = {
          fulfillment: {
            line_items_by_fulfillment_order: real_result,
            notify_customer: true,
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

        res.status(200).json({
          message: `Status for order with ID - ${valid_order_id} is now updated to FULFILLED`,
        });
      }
    });
  } catch (error) {
    console.error("Error updating status for unfulfilled_orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
