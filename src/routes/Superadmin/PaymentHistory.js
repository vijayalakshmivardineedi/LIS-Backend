const express = require('express');
const router = express.Router();
const { GetPaymentsList, updateRenewalStatus } = require("../../controllers/Superadmin/PaymentHistory");

router.get("/getPayments", GetPaymentsList)
router.put("/updatePayments", updateRenewalStatus)
module.exports = router;