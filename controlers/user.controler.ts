import { CatchAsyncError } from "./../middleware/catchAsyncErrors";
require("dotenv").config();
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import ejs from "ejs";
import path from "path";
import sendEmail from "../utils/sendMail";
import {
  getAllUsersService,
  getUserByIdC,
  updateUsersRoleService,
} from "../services/user.service";
import cloudinary from "cloudinary";
import bcrypt from "bcryptjs";
import { generateOTP } from "../utils/otpUtils";
import { createToken } from "../utils/createToken";
import userModel, { IUser } from "../models/user_model";
import mongoose from "mongoose";

const TOKEN_EXPIRY = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

const setTokenCookie = (res: Response, token: string) => {
  res.cookie("token", token, {
    expires: new Date(Date.now() + TOKEN_EXPIRY),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

export const addUserBySuperAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, ...rest } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      isVerified: true,
      ...rest,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userModel.find().select("-password -otp -otpExpiry");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getSingleUser = async (req: Request, res: Response) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select("-password -otp -otpExpiry");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await userModel
      .findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      )
      .select("-password -otp -otpExpiry");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, role, phoneNumber, address } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role || !phoneNumber || !address) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Check if the user already exists
    let user = await userModel.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate OTP and set expiry (10 minutes)
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    // Email data to be used in the template
    const data = { user: { name }, otp };

    // Render email template with data
    const html = await ejs.renderFile(
      path.join(__dirname, "../mails/activationmail.ejs"),
      data
    );

    try {
      // Attempt to send OTP email
      await sendEmail({
        email,
        subject: "Account Verification OTP",
        template: "activationmail.ejs",
        data,
      });

      // If email is sent successfully, create the user
      user = await userModel.create({
        name,
        email,
        password,
        role,
        otp,
        otpExpiry,
        address,
        phoneNumber
      });

      res.status(201).json({
        success: true,
        message:
          "User registered successfully. Please verify your account with the OTP sent to your email.",
      });
    } catch (emailError: any) {
      // If email sending fails, return error
      return next(new ErrorHandler(emailError.message, 400));
    }
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Please provide email and OTP" });
    }

    const user: any = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = createToken(user._id);

    res.status(200).json({
      success: true,
      message: "Account verified successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const ADMIN_EMAIL = "smhosadmin@smhos.org";
const ADMIN_PASSWORD = "come12345"; // Store in environment variables in production

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input presence
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // 3. Handle Super Admin login
    if (email === ADMIN_EMAIL) {
      let adminUser: any = await userModel
        .findOne({ email: ADMIN_EMAIL })
        .select("+password");

      // Create admin if doesn't exist
      if (!adminUser) {
        // Verify admin password before creation
        if (password !== ADMIN_PASSWORD) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        adminUser = await userModel.create({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD, // Will be hashed by model's pre-save hook
          name: "Super Admin",
          role: "Maintenance Admin",
          isVerified: true, // Auto-verify admin account
        });
      }

      // Verify password match
      const isPasswordValid = await adminUser.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token for admin
      const token = createToken(adminUser._id);
      setTokenCookie(res, token);
      return res.status(200).json({
        success: true,
        token,
        user: adminUser,
      });
    }

    // 4. Regular user login
    const user: any = await userModel.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "Account not verified" });
    }

    const token = createToken(user._id);
    setTokenCookie(res, token);
    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const resendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Please provide email" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const data = { user: { name: user.name }, otp };
    const html = await ejs.renderFile(
      path.join(__dirname, "../mails/activationmail.ejs"),
      data
    );
    try {
      await sendEmail({
        email: email,
        subject: "Account Verification OTP",
        template: "activationmail.ejs",
        data,
      });
      res.status(200).json({
        success: true,
        message: "OTP resent successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  } catch (error) {
    next(error);
  }
};

export const loginWithEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Please provide an email" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: "Please verify your account before logging in" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;

    // Email data to be used in the template
    const data = { otp };

    // Render email template with data
    const html = await ejs.renderFile(
      path.join(__dirname, "../mails/activationmail.ejs"),
      data
    );

    try {
      // Attempt to send OTP email
      await sendEmail({
        email,
        subject: "Account Verification OTP",
        template: "activationmail.ejs",
        data,
      });

      // If email is sent successfully, create the user
      await user.save();

      res.status(200).json({
        success: true,
        message: "OTP sent to your email for login verification",
      });
    } catch (emailError: any) {
      // If email sending fails, return error
      return next(new ErrorHandler(emailError.message, 400));
    }
  } catch (error) {
    next(error);
  }
};

export const verifyLoginOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Please provide email and OTP" });
    }

    const user: any = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = createToken(user._id);
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const user = await userModel
      .findById(userId)
      .select("-password -otp -otpExpiry");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordApi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;

    // Email data to be used in the template
    const data = { otp };

    // Render email template with data
    const html = await ejs.renderFile(
      path.join(__dirname, "../mails/activationmail.ejs"),
      data
    );

    try {
      // Attempt to send OTP email
      await sendEmail({
        email,
        subject: "Account Verification OTP",
        template: "activationmail.ejs",
        data,
      });

      // If email is sent successfully, create the user
      await user.save();

      res.status(200).json({
        success: true,
        message: "Password reset OTP sent to your email",
      });
    } catch (emailError: any) {
      // If email sending fails, return error
      return next(new ErrorHandler(emailError.message, 400));
    }
  } catch (error) {
    next(error);
  }
};

export const resetPasswordApi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const socialLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Please provide name and email" });
    }

    let user: any = await userModel.findOne({ email });

    if (!user) {
      // Create a new user if not found
      user = await userModel.create({
        name,
        email,
        password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10), // Generate a random password
        isVerified: true, // Social login users are considered verified
      });
    }

    const token = createToken(user._id);
    setTokenCookie(res, token);
    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

interface IUpdateUserPassword {
  currentPassword: string;
  newPassword: string;
}

export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body as IUpdateUserPassword;
    console.log(currentPassword, newPassword, "id");

    // Check if the authenticated user is trying to update their own password
    if (userId !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only update your own password." });
    }

    const user = await userModel.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

interface IUpdateUserProfilePic {
  avatar: string;
}

export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { avatar } = req.body as IUpdateUserProfilePic;
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User ID not provided", 400));
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    if (!avatar) {
      return next(new ErrorHandler("No avatar provided", 400));
    }
    // Delete existing avatar if it exists
    if (user.avatar?.public_id) {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    }

    // Upload new avatar
    const uploadedAvatar = await cloudinary.v2.uploader.upload(avatar, {
      folder: "avatar",
      width: 400,
    });

    // Update user profile with new avatar
    user.avatar = {
      public_id: uploadedAvatar.public_id,
      url: uploadedAvatar.secure_url,
    };

    await user.save();

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// user profile info
export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, role, phoneNumber } = req.body;

      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      if (user) {
        user.name = name;
        user.phoneNumber = phoneNumber;
        user.role = role;
      }

      await user?.save();
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all users for admin
export const getAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUsersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get user by id
export const getUserById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
      const user = await userModel.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        user,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);

// fetching user info
export const getUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserByIdC(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// logout
export const logout = (req: Request, res: Response) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

// delete user by admin

export const deleteUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await userModel.findById(id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      await user.deleteOne({ id });
      res.status(200).json({
        success: true,
        message: "User deleted successful",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update user role
export const upDateUserRole = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, role, isSuspend, reason } = req.body;
      updateUsersRoleService(res, id, role, isSuspend, reason);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// chat

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userModel.findById(req.user?._id).select("-password");
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Ensure the user is treated as a guest
    const guestUser = {
      ...user.toObject(),
      role: "guest",
    };

    res.status(200).json({
      success: true,
      user: guestUser,
      message: "Current user retrieved successfully as guest",
    });
  } catch (error) {
    next(error);
  }
};

// Add user property
export const addUserProperty = async (req: Request, res: Response) => {
  try {
    const { userId, property } = req.body;

    if (!userId || !property) {
      return res
        .status(400)
        .json({ message: "User ID and property are required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.user_property = property;
    await user.save();

    res.status(200).json({ message: "User property added successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Remove user property
export const removeUserProperty = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.user_property = "";
    await user.save();

    res
      .status(200)
      .json({ message: "User property removed successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
