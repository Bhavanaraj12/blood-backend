// const mongoose = require('mongoose');
// require('dotenv').config();
// const {  istDate } = require('../utils');
// const mongoosedb = process.env.DATABASE_URL;

// mongoose.connect(mongoosedb, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log('Connected to MongoDB'))
//     .catch(err => console.error('Error connecting to MongoDB:', err));

// const schema = mongoose.Schema;

// var enquiryschema = new schema({
//     customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
//     send_to: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
//     prod_id: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
//     start_date: { type: Date },
//     end_date: { type: Date }
// }, {
//     timestamps: true
// })

// enquiryschema.pre('save', function (next) {
//     this.createdAt = istDate
//     this.updatedAt = istDate
//     next();
// });

// const enquiryTable = mongoose.model("enquiry", enquiryschema)

// module.exports = enquiryTable
