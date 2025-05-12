const express = require('express');
const clientController = require('../controllers/clientController');

const router = express.Router();

router.post('/register', clientController.registerClient);
router.post('/add-address', clientController.addAddress);

module.exports = router;
