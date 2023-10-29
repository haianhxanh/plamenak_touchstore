import Joi from "joi";

export const validate_order_id = Joi.number().required().messages({
    'any.required': 'Order_id is required'
  })

export const validate_order_status = Joi.string().trim().required().messages({
    'any.required': 'Order Status is required'
  })






