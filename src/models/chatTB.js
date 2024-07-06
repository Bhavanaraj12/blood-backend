// const mongoose = require('mongoose');
// require('dotenv').config();
// const {  istDate } = require('../utils');
// const mongoosedb = process.env.DATABASE_URL;

// mongoose.connect(mongoosedb, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log('Connected to MongoDB'))
//     .catch(err => console.error('Error connecting to MongoDB:', err));

// const schema = mongoose.Schema;

// var chatschema = new schema({
//     message: { type: String },
//     receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
//     sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
//     prod_id: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
//     read: { type: String }
// }, {
//     timestamps: true
// })

// chatschema.pre('save', function (next) {
//     this.createdAt = istDate
//     this.updatedAt = istDate
//     next();
// });

// const chatTable = mongoose.model("chat", chatschema)

// module.exports = chatTable
