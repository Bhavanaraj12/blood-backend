const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");
require('dotenv').config()
const winston = require('winston');
const fs = require('fs');
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const hbs = require("nodemailer-express-handlebars");
const CryptoJS = require('crypto-js');


const algorithm = 'aes-256-cbc'; // Although crypto-js doesn't use this directly
const key = CryptoJS.enc.Hex.parse(process.env.ENCRYPTION_KEY); // Convert hex key to WordArray
console.log("key::", key.sigBytes);
const iv = CryptoJS.enc.Hex.parse(process.env.IV); // Convert hex IV to WordArray
console.log("iv::::;", iv.sigBytes);

const assert = require('assert');

// Create a logs directory if it doesn't exist
const logDirectory = './logs';
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Configure the Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: `${logDirectory}/error.log`, level: 'error' }),
    new winston.transports.File({ filename: `${logDirectory}/combined.log` }),
  ],
});

const currentDate = new Date();
// const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
const istOffset = 5.5 * 60 * 60 * 1000;
const istDate = new Date(currentDate.getTime() + istOffset);



// const encrypt = (text) => {
//   let cipher = crypto.createCipheriv(algorithm, key, iv);
//   console.log("object", cipher)
//   let encrypted = cipher.update(text, 'utf8', 'hex');
//   encrypted += cipher.final('hex');
//   return encrypted;
// };
const encrypt = (text) => {
  console.log("Input to encrypt function:", text);
  const encrypted = CryptoJS.AES.encrypt(text, key, { iv: iv }).toString();
  console.log("Encrypted value:", encrypted);
  return encrypted;
};

const decrypt = (text) => {
  if (text == null) {
    return null; // or whatever default value you want to return
  }
  const bytes = CryptoJS.AES.decrypt(text, key, { iv: iv });
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return decrypted;
};


module.exports = {
  express,
  bcrypt,
  path,
  logger,
  fs,
  jwt,
  istDate,
  otpGenerator,
  nodemailer,
  hbs,
  assert,
  encrypt,
  decrypt
};