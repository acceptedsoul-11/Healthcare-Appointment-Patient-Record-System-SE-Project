
import mongoose, { Schema, Model } from "mongoose";

export type UserRole =
  | "patient"
  | "doctor"
  | "receptionist"
  | "administrator";

export interface IUser {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "receptionist", "administrator"],
      required: true,
      default: "patient",
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
