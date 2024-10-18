const express = require('express');
const { addUPI } = require('../controllers/UPI');
const router = express.Router();


router.post('/addUpi', addUPI)

module.exports = router