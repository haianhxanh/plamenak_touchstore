import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import Orders from "../model/orders.model";
import {
  validate_order_id,
  validate_order_status,
} from "../utilities/input_validation";
import { ORDER_STATUS } from "../utilities/constants";

dotenv.config();

const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;

export const status_update = async (order_id: string, status: string) => {
  // update database
  const update_status = await Orders.update(
    { status: status },
    {
      where: {
        order_id: order_id,
      },
    }
  );

  const order_tags = await axios
    .get(`https://${STORE}/admin/api/${API_VERSION}/orders/${order_id}.json`, {
      headers: {
        "X-Shopify-Access-Token": ACCESS_TOKEN!,
      },
    })
    .then((response) => {
      let order_tags = response.data.order.tags;
      let order_tags_arr = order_tags.split(",");
      order_tags_arr.forEach((tag: any, i: any) => {
        if (tag.includes("TS_")) {
          order_tags_arr[i] = status;
        }
      });
      order_tags = order_tags_arr.toString();
      return order_tags;
    });

  const body = {
    order: {
      id: order_id,
      tags: order_tags,
    },
  };

  const { data } = await axios.put(
    `https://${STORE}/admin/api/${API_VERSION}/orders/${order_id}.json`,
    body,
    {
      headers: {
        "X-Shopify-Access-Token": ACCESS_TOKEN!,
      },
    }
  );
};
