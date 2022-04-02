const express = require('express');
const router = express.Router();
const {getPrivateData} = require('../modules/private');
const {protect} = require('../middleware/auth')

router.get('/Authorized',protect,getPrivateData);

module.exports = router;