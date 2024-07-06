const express = require("express");
const { savechat, viewChat, fullchat ,chatlist} = require("./chat.controller");


const chatRoutes = express.Router()

chatRoutes.post('/savechat', savechat)
chatRoutes.post('/viewchat', viewChat)
chatRoutes.post('/fullchat', fullchat)
chatRoutes.post('/chatlist',chatlist)

module.exports = chatRoutes