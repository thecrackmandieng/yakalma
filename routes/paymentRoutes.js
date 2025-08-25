const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/init", paymentController.initPayment);
router.post("/notify", paymentController.notifyPayment);
router.get("/return", paymentController.returnPayment);

module.exports = router;
