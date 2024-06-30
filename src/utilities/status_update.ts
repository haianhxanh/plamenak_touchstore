import axios from "axios";
import dotenv from "dotenv";
import Orders from "../model/orders.model";
import { ORDER_STATUS } from "../utilities/constants";
import { promisify } from "util";
const sleep = promisify(setTimeout);

dotenv.config();

const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;

export const status_update = async (order_id: string, status: string) => {
  // check if order record exists
  const order = await Orders.findOne({
    where: {
      order_id: order_id,
    },
  });
  if (!order) {
    return;
  }
  // update database
  const update_status = await Orders.update(
    { status: status },
    {
      where: {
        order_id: order_id,
      },
    }
  );

  // update Shopify
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
        if (tag.includes("TS_") && tag !== ORDER_STATUS.ERROR) {
          order_tags_arr[i] = status;
        } else {
          order_tags_arr.push(status);
        }
      });
      order_tags_arr = order_tags_arr.filter(
        (tag: any) => tag !== ORDER_STATUS.FORCE_SEND
      );
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

export const error_status_update = async (
  order_id: string,
  status: string,
  error_id: string,
  error_name: string,
  error_note: string
) => {
  // update database
  const update_status = await Orders.update(
    { status: status },
    {
      where: {
        order_id: order_id,
      },
    }
  );

  // update Shopify

  const order_details = await axios
    .get(`https://${STORE}/admin/api/${API_VERSION}/orders/${order_id}.json`, {
      headers: {
        "X-Shopify-Access-Token": ACCESS_TOKEN!,
      },
    })
    .then((response) => {
      let order_tags = response.data.order.tags;
      let order_attributes = response.data.order.note_attributes;
      let order_tags_arr = order_tags.split(",");
      order_tags_arr.forEach((tag: any, i: any) => {
        if (status == ORDER_STATUS.ERROR) {
          order_tags_arr.push(status);
        } else {
          if (tag.includes("TS_") && tag !== ORDER_STATUS.ERROR) {
            order_tags_arr[i] = status;
          }
        }
      });
      order_tags_arr = order_tags_arr.filter(
        (tag: any) => tag !== ORDER_STATUS.FORCE_SEND
      );
      order_tags = order_tags_arr.toString();
      return [order_tags, order_attributes];
    });

  let order_attributes = order_details[1];
  order_attributes.push({ name: "error_id", value: error_id });
  order_attributes.push({ name: "error_name", value: error_name });
  order_attributes.push({ name: "error_note", value: error_note });

  const body = {
    order: {
      id: order_id,
      tags: order_details[0],
      note_attributes: order_attributes,
    },
  };

  await sleep(1000);

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
