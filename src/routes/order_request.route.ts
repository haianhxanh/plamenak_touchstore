import express from "express";
import {
  get_unfulfilled_orders,
  all_orders,
} from "../controllers/get_order.controller";
import { update_order_status } from "../controllers/update_order_status.controller";
import { auth } from "../Authorization/api_authorization";
import { fulfill_order } from "../controllers/fulfill_order.controller";
import { error_order } from "../controllers/error_order.controller";
import { send_order } from "../controllers/send_order.controller";

const router = express.Router();

router.get("/orders", auth, get_unfulfilled_orders);
router.put("/update_order", auth, update_order_status);
router.get("/all_orders", auth, all_orders);
router.post("/send", auth, send_order);
router.put("/error", auth, error_order);

export default router;
