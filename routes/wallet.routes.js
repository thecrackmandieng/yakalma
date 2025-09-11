const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");

router.get("/:userId", walletController.getWalletByUser);
router.get("/history/:userId", walletController.getWalletHistory);
router.post("/update", walletController.updateWallet); // crédit/débit manuel

module.exports = router;
