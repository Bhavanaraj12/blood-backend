const express = require("express");
const { cus_getnotification ,readnotification, renttimeleftnotification,deletenotification} = require("./notification.controller");
const notificationRoutes = express.Router()

notificationRoutes.post('/cus_getnotification',cus_getnotification)
notificationRoutes.post('/readnotification',readnotification)
notificationRoutes.get('/rentnotification',renttimeleftnotification)
notificationRoutes.post('/deletenotification',deletenotification)

module.exports = notificationRoutes 