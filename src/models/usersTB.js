const mongoose = require('mongoose');
require('dotenv').config();
const { istDate } = require('../utils');
const mongoosedb = process.env.DATABASE_URL;
const { encrypt, decrypt } = require('../utils');
mongoose.connect(mongoosedb, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

const schema = mongoose.Schema;

var usersSchema = new schema({
  name: { type: String, set: encrypt, get: decrypt },
  image: { type: String, set: encrypt, get: decrypt },
  email: { type: String, unique: true, set: encrypt, get: decrypt },
  password: { type: String, set: encrypt, get: decrypt },
  phone_number: { type: String, set: encrypt, get: decrypt },
  temp_otp: { type: String, set: encrypt, get: decrypt },
  google_id: { type: String, set: encrypt, get: decrypt },
  is_active: { type: String, set: encrypt, get: decrypt },
  referral_id:{ type: String, set: encrypt, get: decrypt },
  club_id:{ type: String, set: encrypt, get: decrypt },
  aadhar_number:{ type: String, unique: true, set: encrypt, get: decrypt }
},
  {
    timestamps: true,
    toJSON: { getters: true }, // Ensure getters are applied
    toObject: { getters: true } // Ensure getters are applied
  });

// Define a pre-save hook to update timestamps to IST
usersSchema.pre('save', function (next) {
  this.createdAt = istDate
  this.updatedAt = istDate
  next();
});

const UsersTable = mongoose.model("users", usersSchema);

module.exports = UsersTable;
