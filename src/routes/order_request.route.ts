import express from 'express'
import { get_unfulfilled_orders, all_orders } from '../controllers/get_order.controller'
import { update_order_status } from '../controllers/update_order_status.controller'
import { auth } from '../Authorization/api_authorization'

const router = express.Router()

router.get('/order', auth, get_unfulfilled_orders)
router.put('/update_order', auth, update_order_status)
router.get('/all_order', auth, all_orders)


export default router

















