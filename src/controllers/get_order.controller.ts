import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import Orders from "../model/orders.model";
import { v4 } from "uuid";

dotenv.config();

const { ACCESS_TOKEN, STORE, API_VERSION } = process.env;

/*-------------------------------------GETTING UNFULFILLED ORDERS------------------------------------------------*/

export const get_unfulfilled_orders = async (req: Request, res: Response) => {
  try {
    /*--------------------------------------FETCHING DATA FROM CUSTOM API------------------------------------------*/

    const { data } = await axios.get(
      `https://${STORE}/admin/api/${API_VERSION}/orders.json?tag=TS_in_progress`,
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
    
    if(unfulfilled_orders.length === 0){
      res.status(400).json({
        message: `There are no initial orders with unfulfilled status from your shopify store`
      })
    }else{
    /*----------------------CONVERTING THE STRUCTURE OF THE RECEIVED DATA TO THE CUSTOM DATA STRUCTURE REQUIRED BY THE CARRIER PROVIDER----------------*/

    const custom_structure: any = [];
    unfulfilled_orders.map((structure: any) => {
      structure.shipping_lines.map((s_l: any) => {
        const custom_schema = {
          order_id: structure.id,
          carrier: s_l.title,
          carrier_product: "null",
          carrier_branch_id: "null",
          extra_branch_id: "null",
          priority: 4,
          status: structure.tags,
          recipient_name: structure.shipping_address.name,
          recipient_contact: "null",
          recipient_street: structure.shipping_address.address1,
          recipient_city: structure.shipping_address.city,
          recipient_state: structure.shipping_address.country,
          recipient_zip: structure.shipping_address.zip,
          recipient_country_code: structure.shipping_address.country_code,
          recipient_phone: structure.shipping_address.phone,
          recipient_email: structure.customer.email,
          weight: structure.total_weight,
          ic: "null",
          dic: "null",
          note: structure.note,
          driver_note: "null",
          services: [],
          ref: structure.order_number,
          label: structure.order_number,
          barcode: structure.order_number,
          cod_vs: structure.order_number,
          cod_amount: 0,
          cod_currency: structure.currency,
          cod_card_payment: false,
          ins_amount: structure.total_price,
          ins_currency: structure.currency,
          date_delivery: "null",
          date_source: "null",
          products: [],
        };
        custom_structure.push(custom_schema);
      });
    });

    unfulfilled_orders.map((structure: any) => {
      custom_structure.map((struct: any) => {
        if (structure.id === struct.order_id) {
          structure.line_items.map((l_i: any) => {
            const product_order = {
              item_id: l_i.id,
              sku: l_i.sku,
              name: l_i.title,
              ean: "null",
              qty: l_i.quantity,
              image_url: "null",
              unit: "ks",
              location: "null",
              note: "null",
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
            unfulfilled_data.status.includes('TS_')
        );
        if (total_unfulfilled_data.length === 0) {
          res.status(200).json({
            message: `ALL ORDERS HAS BEEN FULFILLED`,
          });
        } else if (total_unfulfilled_data.length > 0) {
          res.status(200).json({
            message: `All unfulfilled orders have been fetched`,
            data: total_unfulfilled_data,
          });
        }
      } else {
        new_data.map(async (data: any) => {
          const checking_existing_data = await Orders.create({
            id: v4(),
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
            (unfulfilled_data: any) => unfulfilled_data.status.includes("TS_")
          );

          if (total_unfulfilled_data.length === 0) {
            res.status(200).json({
              message: `ALL ORDERS HAS BEEN FULFILLED`,
            });
          } else if (total_unfulfilled_data.length > 0) {
            res.status(200).json({
              message: `New Orders has been stored. All unfulfilled orders has been gotten`,
              data: total_unfulfilled_data,
            });
          }
        });
      }
    } else {
      custom_structure.map(async (data: any) => {
        const checking_existing_data = await Orders.create({
          id: v4(),
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
          (unfulfilled_data: any) => unfulfilled_data.status.includes("TS_")
        );

        if (total_unfulfilled_data.length === 0) {
          res.status(200).json({
            message: `ALL ORDERS HAS BEEN FULFILLED`,
          });
        } else if (total_unfulfilled_data.length > 0) {
          res.status(200).json({
            message: `All unfulfilled orders has been gotten`,
            data: total_unfulfilled_data,
          });
        }
      });
    }
  }
  } catch (error) {
    console.error("Error getting unfulfilled_orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


/*-------------------------------------GETTING ALL ORDERS IN THE DATABASE------------------------------------------------*/


export const all_orders = async (req: Request, res: Response) => {
  try{

    const get_data: any = await Orders.findAll({});
    const total_db_data = get_data.map((db_data: any) => {
      return db_data.dataValues;
    });

    if(total_db_data.length === 0){
      res.status(400).json({
        message: `There are no orders data in the database.`
      })
    }else{

    res.status(200).json({
      message: `ALL ORDERS GOTTEN`,
      data: get_data
    })
  }

  }catch(error){
    console.error("Error all orders from database:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}







