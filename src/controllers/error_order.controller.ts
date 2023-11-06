import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import Orders from "../model/orders.model";
import { validate_order_id } from "../utilities/input_validation";
import { ORDER_STATUS } from "../utilities/constants";
import { status_update, error_status_update } from "../utilities/status_update";

dotenv.config();
const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;

export const error_order = async (req: Request, res: Response) => {
  try {
    /*------------------VALIDATING THE NEEDED INPUT DATA FOR THE PROGRAM-------------------------*/
    let valid_input_id = validate_order_id.validate(req.body.order_id);

    if (valid_input_id.error) {
      const error_message = valid_input_id.error.details[0].message;
      return res.status(400).json({ message: `order_id - ${error_message}` });
    }
    const order_id = valid_input_id.value;

    error_status_update(
      order_id.toString(),
      ORDER_STATUS.ERROR,
      req.body.error_id,
      req.body.error_name,
      req.body.error_note
    );

    res.status(200).json({
      message: `Status of order ${order_id} has been updated to ${ORDER_STATUS.ERROR}, see Shopify admin for more details`,
    });
  } catch (error) {
    console.error(`Error updating status of order ${req.body.order_id}`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
