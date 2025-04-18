import mongoose, { Document, Model, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
  name: string;
  email: string;
  user_property: string;
  password: string;
  role: "user" | "Maintenance Admin";
  phoneNumber?: string;
  address: string;
  isVerified: boolean;
  avatar: {
    public_id: string;
    url: string;
  };
  otp: string;
  otpExpiry: Date;

  comparePassword: (password: string) => Promise<boolean>;
  getJwtToken: () => string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    address: { type: String },
    user_property: { type: String },
    email: {
      type: String,
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "Please enter a valid email",
      },
      unique: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      enum: ["user", "Maintenance Admin"],
      default: "user",
      required: true,
    },

    phoneNumber: { type: String },
    otp: { type: String },
    otpExpiry: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
};

userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("AssetsUser", userSchema);
export default userModel;
