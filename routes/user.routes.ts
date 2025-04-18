import express from "express";
import {
  addUserBySuperAdmin,
  addUserProperty,
  deleteUser,
  forgotPasswordApi,
  getAllUsers,
  getCurrentUser,
  getSingleUser,
  getUser,
  getUserById,
  getUserInfo,
  getUsers,
  login,
  loginWithEmail,
  logout,
  register,
  removeUserProperty,
  resendOTP,
  resetPasswordApi,
  socialLogin,
  updatePassword,
  updateUser,
  updateUserInfo,
  updateUserProfile,
  upDateUserRole,
  verifyLoginOTP,
  verifyOTP,
} from "../controlers/user.controler";
import { authenticate } from "../middleware/auth";

const userRouter = express.Router();

userRouter.post("/add-user-admin", authenticate, addUserBySuperAdmin);
userRouter.get("/admin-all-users", authenticate, getUsers);
userRouter.delete("/delete-user/:id", authenticate, deleteUser);
userRouter.get("/single-user/:id", authenticate, getSingleUser);
userRouter.put("/admin-edit-users/:id", authenticate, updateUser);

userRouter.post("/add-property", authenticate, addUserProperty);
userRouter.post("/remove-property", authenticate, removeUserProperty);

userRouter.post("/register-user", register);

userRouter.post("/verify-otp", verifyOTP);

userRouter.post("/login", login);
userRouter.post("/resent-otp", resendOTP);
userRouter.get("/get-user-info/:userId", authenticate, getUserInfo);
userRouter.post("/login-with-email-only", loginWithEmail);
userRouter.post("/login-with-email-only-otp", verifyLoginOTP);
userRouter.post("/reset-password", resetPasswordApi);
userRouter.post("/forgot-password", forgotPasswordApi);
userRouter.post("/social-login", socialLogin);
userRouter.get("/get-users", getAllUsers);
userRouter.put("/user/:userId/password", authenticate, updatePassword);
userRouter.post("/logout", authenticate, logout);
userRouter.get("/user", authenticate, getUser);
userRouter.put("/update-user-info", authenticate, updateUserInfo);
userRouter.put("/update-user-avatar", authenticate, updateUserProfile);
userRouter.get("/users/:userId", authenticate, getUserById);

userRouter.put("/update-user-role", authenticate, upDateUserRole);

// test for chat
userRouter.get("/current", authenticate, getCurrentUser);

export default userRouter;
