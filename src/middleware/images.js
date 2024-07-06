// const { S3 } = require('@aws-sdk/client-s3');
// const multerS3 = require('multer-s3')
// const multer = require('multer')
// require('dotenv').config()
// const crypto = require('crypto');

// // Configure AWS SDK
// const awsS3 = new S3({
//     region: process.env.BUCKET_REGION, 
//     credentials: {
//       accessKeyId: process.env.ACCESS_KEY,
//       secretAccessKey: process.env.SECRET_ACCESSKEY
//     },
//   });

//   console.log("heyyyy")


//   //Multer S3 configuration
 
//   const upload = multer({
//     storage: multerS3({
//       s3: awsS3,
//       bucket: process.env.BUCKET_NAME,
//       key: function (req, file, cb) {
//         crypto.randomBytes(16, (err, raw) => {
//           if (err) return cb(err);
//           cb(null, Date.now().toString() + '-' + raw.toString('hex') + '-' + file.originalname);
//         });
//       },
//     }),
//   });



  
//   module.exports = {upload}