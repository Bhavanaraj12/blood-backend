const express = require('express')
require('dotenv').config();
const PORT = process.env.PORT
const HOST = process.env.HOST

const server = express()
var bodyParser = require('body-parser')
const cors = require("cors");
const helmet = require("helmet");
const usersRoutes = require('./src/routes/users/users.routes');

const notificationRoutes = require('./src/routes/notification/notification.routes');
const chatRoutes = require('./src/routes/chat/chat.routes');
// const notificationController = require('./src/routes/notification/notification.controller');
server.use(cors({
  origin: "*",
  allowedHeaders: "X-Requested-With,Content-Type,auth-token,Authorization",
  credentials: true
}))

server.use(express.json());
server.use(express.static('./public'))
server.use(express.urlencoded({ extended: true }))
server.use(bodyParser.json())
server.use('/user', usersRoutes)
server.use('/notification', notificationRoutes)
server.use('/chat', chatRoutes)

// const triggerNotification = async () => {
//   try {
//     await notificationController.renttimeleftnotification();
//     await notificationController.rentchangestatus()
//   } catch (error) {
//     console.error('Error triggering notification:', error);
//   }
// };

// const startBackgroundTasks = () => {
//   const intervalId = setInterval(triggerNotification, 60000); // Execute every minute (adjust the interval)
//   return intervalId;
// };
// // Start background tasks
// startBackgroundTasks();

server.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

if (process.env.NODE_ENV === "development") {
  server.listen(PORT, () => {
    console.log(`server started at ${HOST}:${PORT}`)
  }
  )
}