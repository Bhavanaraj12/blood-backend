const express = require("express");
const UsersTable = require("../../models/usersTB");
require("dotenv").config();
const {
  bcrypt,
  logger,
  jwt,
  nodemailer,
  otpGenerator,
  path,
  hbs,
  fs,
  encrypt,
  decrypt,
} = require("../../utils");
require("dotenv").config();

const usersadd = async (request, response) => {
  console.log("reqqqq", request);
  try {
    const {
      name,
      password,
      email,
      phone_number,
      referral_id,
      club_id,
      aadhar_number,
    } = request.body;
    if (!name || !password || !email || !phone_number) {
      let resptext = `Missing required fields`;

      return response.status(400).json({
        message: resptext,
        error: true,
      });
    }
    const image = request.file?.location;
    console.log({ image });
    const mobileNumber = phone_number;
    if (!validateMobileNumber(mobileNumber)) {
      console.log("Invalid mobile number");
      const resptext = "Invalid mobile number!";
      return response.status(404).json({
        error: true,
        message: resptext,
      });
    }

    function validateMobileNumber(mobileNumber) {
      // Regular expression for a valid 10-digit Indian mobile number
      const mobileNumberRegex = /^[6-9]\d{9}$/;
      return mobileNumberRegex.test(mobileNumber);
    }

    const email_id = email;
    if (!validateEmail(email_id)) {
      console.log("Invalid email address");
      const resptext = "Invalid email address!";
      return response.status(404).json({
        error: true,
        message: resptext,
      });
    }

    function validateEmail(email_id) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email_id);
    }

    
    const existingUserPhone = await UsersTable.findOne({
      phone_number: phone_number,
    });
    console.log({ existingUserPhone });
    if (existingUserPhone) {
      console.log("heyy");
      return response.status(400).json({
        error: true,
        message: "Phone number already exists!",
      });
    }
    // Check if email already exists
    const existingUserEmail = await UsersTable.findOne({ email: email });
    console.log({ existingUserEmail });
    if (existingUserEmail) {
      return response.status(400).json({
        error: true,
        message: "Email already exists!",
      });
    }

    const hashedPass = await bcrypt.hash(password, 5);
    const characters = "0123456789";
    let otp = "";

    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      otp += characters.charAt(randomIndex);
    }
    const hashedOtp = await bcrypt.hash(otp, 6);

    // Mailing section
    // const transporter = nodemailer.createTransport({
    //     host: "smtp.zoho.in",
    //     port: 465,
    //     auth: {
    //         user: process.env.EMAIL_USER,
    //         pass: process.env.EMAIL_PASS
    //     },
    //     secure: true,
    //     tls: {
    //         rejectUnauthorized: false,
    //     },
    // });
    // const handlebarOptions = {
    //     viewEngine: {
    //         partialsDir: path.resolve("./src/views"),
    //         defaultLayout: false,
    //     },
    //     viewPath: path.resolve("./src/views"),
    // };

    // transporter.use("compile", hbs(handlebarOptions));
    // let mailOptions = {
    //     from: process.env.EMAIL_USER,
    //     to: email,
    //     subject: "OTP Mail",
    //     template: "user_temp_otp",
    //     context: {
    //         username: name,
    //         otp: otp,
    //     },
    // };
    // transporter.sendMail(mailOptions, function (err, info) {
    //     if (err) {
    //         return
    //     }
    const newUser = {
      name,
      password: hashedPass,
      email,
      phone_number,
      referral_id,
      club_id,
      aadhar_number,
      is_active: "N",
    };

    const addUserResult = UsersTable.create(newUser);
    console.log({ addUserResult });

    if (addUserResult != null && addUserResult != undefined) {
      response.status(200).json({
        message: "User added successfully",
        success: true,
        error: false,
      });
    } else {
      console.error("Error adding user:", addUserResult.error);
      response
        .status(500)
        .json({ message: "An error occurred while adding the user" });
    }
    // })
  } catch (error) {
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.email === 1
    ) {
      console.error("Duplicate key error:", error);
      return response.status(400).json({ error: "Email already exists!" });
    } else {
      console.error("Error adding user:", error);
      logger.error(`Internal server error: ${error.message} in addUsers api`);
      response
        .status(500)
        .json({ error: "An error occurred while adding the user!" });
    }
  }
};

const emailverification = async (request, response) => {
  console.log("emailverification", request.body);
  const { email, otp } = request.body;

  if (!email || !otp) {
    logger.error(`email or otp field is empty in otpLogin api`);
    response.status(400).json({
      error: true,
      message: "email or otp field is empty!",
    });
    return;
  }
  try {
    const user = await UsersTable.findOne({ email: email });
    console.log("user", user);
    if (!user) {
      response.status(400).json({
        error: true,
        message: "No user found!",
      });
    } else {
      const dbOtp = user.temp_otp;
      const result = await bcrypt.compare(otp, dbOtp);
      if (!result) {
        logger.error(`otp is not matching -in otpLogin api`);
        response.status(401).json({
          error: true,
          message: "otp is not matching!",
        });
      } else {
        const update = await UsersTable.updateOne(
          { email: email },
          { $set: { is_active: "Y" } }
        );
        if (update) {
          response.status(200).json({
            success: true,
            message: "Email verified",
          });
        }
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in emailverification api`
    );
    response.status(500).json({ error: "An error occurred" });
  }
};

const login = async (request, response) => {
  console.log("first", request.body);
  try {
    const { user_name, password } = request.body;
    let user;

    if (!password) {
      return response.status(401).json({
        error: true,
        success: false,
        message: "Password required!",
      });
    }

    if (user_name) {
      let query = {};
      if (typeof user_name === "number") {
        user_name = user_name.toString(); // Convert number to string
        console.log({ user_name });
      }
      query = { $or: [{ email: user_name }, { phone_number: user_name }] };

      user = await UsersTable.findOne(query);
      console.log("user", user);
      if (!user) {
        return response.status(401).json({
          error: true,
          success: false,
          message: "Incorrect Email or Phone number!",
        });
      } else if (!user.is_active || user.is_active === "N") {
        return response.status(401).json({
          error: true,
          success: false,
          message: "Please verify your Email!",
        });
      }
    } else {
      return response.status(401).json({
        error: true,
        success: false,
        message: "Email or phone number required!",
      });
    }

    const hashedDbPassword = user.password;
    bcrypt.compare(password, hashedDbPassword, function (err, result) {
      if (err) {
        return response.status(500).json({
          error: true,
          success: false,
          message: "Password hashing error!",
        });
      }

      if (!result) {
        return response.status(401).json({
          error: true,
          success: false,
          message: "Please check your password!",
        });
      }
      // const token = jwt.sign({
      //     id: user._id,
      //     name: user.name,
      //     email: user.email,

      //   },
      //     `${process.env.Token_password}`,
      //     { expiresIn: "60m" }
      //   )
      //   response.status(201).json({
      //     token: token,
      //     data: user,
      //     success: true,
      //     error: false
      //   });

      return response.status(200).json({
        success: true,
        error: false,
        login_id: user._id,
        name: user.name,
        email: user.email,
        message: "Login successful",
      });
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in login api`);
    response.status(500).json({ error: "An error occurred" });
  }
};

const editUser = async (request, response) => {
  console.log("reqqqedittt", request.body);
  try {
    const userId = request.body.id;
    const { name, email, password, phone_number } = request.body;
    if (!userId) {
      return response.status(401).json({
        error: true,
        success: false,
        message: "Required fields cannot be null!",
      });
    }
    // Decode base64 string to buffer
    // const imageData = fromBase64(image);

    // // Generate unique filename
    // const filename = `${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`; // Adjust the filename generation as needed

    // const s3Params = {
    //     Bucket: process.env.BUCKET_NAME,
    //     Key: filename,
    //     Body: imageData,
    //     ACL: 'public-read' // Make uploaded image publicly accessible
    // };

    // // Upload image to S3
    // const s3Response = await s3Client.send(new PutObjectCommand(s3Params));
    // const imageUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.BUCKET_REGION}.amazonaws.com/${filename}`;

    // console.log("imageUrl", imageUrl)
    // const image = request.file.location;
    // console.log({ image });
    // Find the user by ID
    let user = await UsersTable.findById(userId);

    if (!user) {
      return response.status(404).json({
        error: true,
        message: "User not found!",
      });
    }

    if (email && user.email !== email) {
      // Check if the new email already exists in the database
      const existingUser = await UsersTable.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userId) {
        return response.status(400).json({
          error: true,
          message: "Email already exists!",
        });
      }
      user.email = email;
    }

    if (name) user.name = name;
    // if (password) {
    //     const hashedPassword = await bcrypt.hash(password, 5);
    //     user.password = hashedPassword;
    // }
    if (phone_number && user.phone_number !== password) {
      user.phone_number = phone_number;
    }

    if (image) {
      user.image = image;
    }

    // Save the user
    user = await user.save();

    return response.json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    return response
      .status(500)
      .json({ error: "An error occurred while updating the user" });
  }
};

const userdetails = async (request, response) => {
  try {
    const userId = request.body.id;
    let user = await UsersTable.findById(userId);

    if (!user) {
      return response.status(404).json({
        error: true,
        message: "User not found!",
      });
    } else {
      response.status(200).json({
        data: user,
        success: true,
        error: false,
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in userdetails api`);
    response
      .status(500)
      .json({ error: "An error occurred while adding the user" });
  }
};

const forgotPwd = async (request, response) => {
  const { email } = request.body;
  try {
    if (email) {
      const user = await UsersTable.findOne({ email: email });

      if (!user) {
        response.status(404).json({
          error: true,
          message: "User not found!",
        });
      } else {
        const characters = "0123456789";
        let otp = "";

        for (let i = 0; i < 6; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          otp += characters.charAt(randomIndex);
        }
        const hashedOtp = await bcrypt.hash(otp, 5);
        console.log("hashedOtp", hashedOtp);
        await UsersTable.updateOne(
          { email: user.email },
          { $set: { temp_otp: hashedOtp } }
        );

        // Mailing section
        const transporter = nodemailer.createTransport({
          host: "smtp.zoho.in",
          port: 465,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          secure: true,
          tls: {
            rejectUnauthorized: false,
          },
        });
        const handlebarOptions = {
          viewEngine: {
            partialsDir: path.resolve("./src/views"),
            defaultLayout: false,
          },
          viewPath: path.resolve("./src/views"),
        };
        // console.log("Email HTML content:", fs.readFileSync(path.resolve("./src/views/user_temp_otp.handlebars"), 'utf8'));
        transporter.use("compile", hbs(handlebarOptions));
        let mailOptions = {
          from: process.env.EMAIL_USER,
          to: email, // Use the user's email here
          subject: "OTP Mail",
          template: "user_temp_otp",
          context: {
            username: user.name, // Use the user_name from the user object
            otp: otp,
          },
        };
        transporter.sendMail(mailOptions, function (err, info) {
          if (err) {
            return;
          }
          response.status(201).json({
            success: true,
            error: false,
            message: "OTP sent successfully",
            data: user.user_id,
          });
        });
      }
    } else {
      logger.error(`email is undefined in forgotPwd!! `);
      response.status(404).json({
        error: true,
        message: "email is undefined",
      });
    }
  } catch (error) {
    console.log(error);
    logger.error(`Internal server error: ${error.message} in forgotPwd api`);
    response.send(error);
  }
};

const resetpassword = async (request, response) => {
  console.log("rrrrrrrrrrrr", request.body);
  const { email, otp, password } = request.body;

  if (!email || (!otp && !password)) {
    logger.error(
      `Email, OTP, or password field is empty in resetpassword api!`
    );
    response.status(400).json({
      error: true,
      message: "Email, OTP, or password field is empty!",
    });
    return;
  }

  try {
    const user = await UsersTable.findOne({ email: email });

    if (!user) {
      response.status(400).json({
        error: true,
        message: "No user found!",
      });
      return;
    }

    if (otp) {
      const dbOtp = user.temp_otp;
      const result = await bcrypt.compare(otp, dbOtp);
      if (!result) {
        logger.error(`OTP is not matching - in resetpassword api`);
        response.status(401).json({
          error: true,
          message: "OTP is not matching!",
        });
        return;
      }
    }

    const hashedPass = await bcrypt.hash(password, 5);
    const update = await UsersTable.updateOne(
      { email: email },
      { $set: { password: hashedPass } }
    );

    response.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in resetpassword api`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

const otpLogin = async (request, response) => {
  const { email, otp } = request.body;

  if (!email || !otp) {
    logger.error(`email or otp field is empty in otpLogin api`);
    response.status(400).json({
      error: true,
      message: "email or otp field is empty",
    });
    return;
  }
  try {
    const user = await UsersTable.findOne({ email: email });

    if (!user) {
      response.status(400).json({
        error: true,
        message: "no user found!",
      });
    } else {
      const dbOtp = user.temp_otp;
      const result = await bcrypt.compare(otp, dbOtp);
      if (!result) {
        logger.error(`otp is not matching -in otpLogin api`);
        response.status(401).json({
          error: true,
          message: "otp is not matching!",
        });
      } else {
        response.status(200).json({
          success: true,
          message: "Login successful",
          data: user,
        });
      }
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in otpLogin api`);
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

const resetPwd = async (request, response) => {
  console.log("byyy", request.body);
  const email = request.body.email;
  const password = request.body.password;

  if (!email || !password) {
    return response.status(400).json({
      error: true,
      message: "Please check fields!",
    });
  }
  try {
    const hashedPass = await bcrypt.hash(password, 5);

    const update = await UsersTable.updateOne(
      { email: email },
      { $set: { password: hashedPass } }
    );
    response.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in resetPwd api`);
    response.status(500).json({
      error: true,
      msg: "Internal server error",
    });
  }
};

const googlesignin = async (request, response) => {
  const email = request.body.email;
  const googleid = request.body.googleid;
  if (!email) {
    return response.status(400).json({
      error: true,
      message: "Please check email",
    });
  }
  try {
    const emailexist = await UsersTable.findOne({ email: email });
    if (emailexist) {
      const googleadd = await UsersTable.findOneAndUpdate(
        { email: email },
        { $set: { google_id: googleid, is_active: "Y" } }
      );
      if (googleadd) {
        response.status(200).json({
          success: true,
          message: "Success",
        });
      }
    } else {
      const add = await UsersTable.create({
        email: email,
        google_id: googleid,
        is_active: "Y",
      });
      if (add) {
        response.status(200).json({
          success: true,
          message: "Success",
        });
      }
    }
  } catch (error) {
    console.log(error);
    logger.error(
      `Internal server error: ${error.message} in googlesignadd api`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};


const newpassword = async (request, response) => {
  console.log("newpassword=====", request.body);
  try {
    const { email, password, newpassword } = request.body;
    let user;

    if (!password) {
      return response.status(401).json({
        error: true,
        success: false,
        message: "Password required!",
      });
    }

    if (password === newpassword) {
      return response.status(400).json({
        error: true,
        success: false,
        message: "New password must be different from the current password!",
      });
    }

    if (email) {
      user = await UsersTable.findOne({ email: email });
      if (!user) {
        return response.status(401).json({
          error: true,
          success: false,
          message: "Incorrect Email!",
        });
      } else if (!user.is_active || user.is_active === "N") {
        return response.status(401).json({
          error: true,
          success: false,
          message: "Please verify your Email!",
        });
      }
    }

    const hashedDbPassword = user.password;
    bcrypt.compare(password, hashedDbPassword, async function (err, result) {
      if (err) {
        return response.status(500).json({
          error: true,
          success: false,
          message: "Password hashing error!",
        });
      }

      if (!result) {
        return response.status(401).json({
          error: true,
          success: false,
          message: "Please check your current password!",
        });
      }
      const newhashedPass = bcrypt.hashSync(newpassword, 5);
      console.log({ newhashedPass });
      try {
        const update = await UsersTable.findOneAndUpdate(
          { email: email },
          { $set: { password: newhashedPass, is_active: "Y" } }
        );
        console.log({ update });
        if (update) {
          return response.status(200).json({
            success: true,
            error: false,
            message: "Successfully changed your password",
          });
        }
      } catch (error) {
        console.log(error);
        return response.status(500).json({
          error: true,
          success: false,
          message: "Error updating password!",
        });
      }
    });
  } catch (error) {
    console.log(error);
    logger.error(`Internal server error: ${error.message} in newpassword api`);
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

module.exports = {
  usersadd,
  login,
  editUser,
  userdetails,
  forgotPwd,
  otpLogin,
  resetPwd,
  googlesignin,
  resetpassword,
  emailverification,
  newpassword,
};
