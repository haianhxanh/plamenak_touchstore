import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import Orders from "../model/orders.model";
import {
  validate_order_id,
  validate_order_status,
} from "../utilities/input_validation";

dotenv.config();

const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;

export const update_order_status = async (req: Request, res: Response) => {
  try {
    /*------------------VALIDATING THE NEEDED INPUT DATA FOR THE PROGRAM-------------------------*/
    let valid_input_id = validate_order_id.validate(req.body.order_id);
    if (valid_input_id.error) {
      const error_message = valid_input_id.error.details[0].message;
      return res.status(400).json({ message: `order_id - ${error_message}` });
    }
    const valid_order_id = valid_input_id.value;

    let valid_input_status = validate_order_status.validate(req.body.status);
    if (valid_input_status.error) {
      const error_message = valid_input_status.error.details[0].message;
      return res.status(400).json({ message: `status - ${error_message}` });
    }
    const valid_order_status = valid_input_status.value;

    /*----------------------------------------DOUBLE CHECKING ORDER EXISTENCE IN THE DATABASE-------------------------------------*/
    const find_order: any = await Orders.findOne({
      where: {
        order_id: +valid_order_id,
      },
    });

    if (find_order) {
      /*-----------------UPDATING THE ORDERS WITH THEIR CURRENT STATUS FROM THE CARRIER PROVIDER TO THE DATA IN THE DATABASE---------------------*/
      const received_order = find_order.dataValues;

      if (received_order.status === "unfulfilled") {
        if (valid_order_status === "unfulfilled") {
          return res.status(400).json({
            message: `Order with ID - ${valid_order_id} is already with an UNFULFILLED status.`,
          });
        }

        if (valid_order_status === "in_progress") {
          const update_status = await Orders.update(
            { status: valid_order_status },
            {
              where: {
                order_id: +valid_order_id,
              },
            }
          );

          return res.status(200).json({
            message: `Status for order with ID - ${valid_order_id} is now set to in_progress.`,
          });
        }

        if (
          valid_order_status === "fulfilled"
        ) {
          /*-----------UPDATING THE FULFILLMENT STATUS FOR ORDERS ON SHOPIFY----------------------*/

          /*------------------Get list of fulfillment orders------------------------*/
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

            if (order.status === "closed") {
              res.status(200).json({
                message: `Fulfillment order ${order.id} has an unfulfillable status= closed.`,
              });
            } else {
              /*------------------------------------------------------CREATE FULFILLMENT---------------------------------------------------------------*/

              const update_status = await Orders.update(
                { status: valid_order_status },
                {
                  where: {
                    order_id: +valid_order_id,
                  },
                }
              );

              const create_fulfillment = {
                fulfillment: {
                  line_items_by_fulfillment_order: real_result,
                },
              };

              const newer_res: any = await axios.post(
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

        } else {
          return res.status(400).json({
            message: `Wrong UPDATE INPUT. Use either 'fulfilled', 'in_progress', or 'fulfilled to send status update.`,
          });
        }
      } else if (received_order.status === "in_progress") {
        if (valid_order_status === "in_progress") {
          return res.status(400).json({
            message: `Order with ID - ${valid_order_id} is already in progress.`,
          });
        }

        if (valid_order_status === "unfulfilled") {
          return res.status(400).json({
            message: `Order with ID - ${valid_order_id} is already in_progress. Cannot change status to UNFULFILLED.`,
          });
        }

        if (valid_order_status === "fulfilled") {

       /*-----------UPDATING THE FULFILLMENT STATUS FOR ORDERS ON SHOPIFY----------------------*/

          /*------------------Get list of fulfillment orders------------------------*/
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

            if (order.status === "closed") {
              res.status(200).json({
                message: `Fulfillment order ${order.id} has an unfulfillable status= closed.`,
              });
            } else {

              const update_status = await Orders.update(
                { status: valid_order_status },
                {
                  where: {
                    order_id: +valid_order_id,
                  },
                }
              );

              const create_fulfillment = {
                fulfillment: {
                  line_items_by_fulfillment_order: real_result,
                },
              };

              const newer_res: any = await axios.post(
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
          })

          return res.status(200).json({
            message: `Status for order with ID - ${valid_order_id} is now updated to FULFILLED`,
          });
        } else {
          return res.status(400).json({
            message: `Wrong UPDATE INPUT. Use either 'fulfilled', 'in_progress', or 'fulfilled to send status update.`,
          });
        }
      } else {
        return res.status(400).json({
          message: `Order with ID - ${valid_order_id} has already been FULFILLED.`,
        });
      }
    } else {
      res.status(404).json({
        message: `Order with id - ${valid_order_id} - NOT FOUND`,
      });
    }
  } catch (error) {
    console.error("Error updating status for unfulfilled_orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


