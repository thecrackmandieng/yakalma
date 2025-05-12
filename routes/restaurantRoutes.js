const express = require('express');
const restaurantController = require('../controllers/restaurantController');

const router = express.Router();

router.post('/register', restaurantController.registerRestaurant);

module.exports = router;
