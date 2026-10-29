
import mongoose, { Schema, Model } from "mongoose";

export type UserRole =
  | "patient"
  | "doctor"
  | "receptionist"
  | "administrator";

export type AccountStatus = "pending" | "approved" | "rejected";

export interface IUser {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  accountStatus: AccountStatus;
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
    // Existing accounts predate approval workflow and remain usable. New doctor
    // applications explicitly override this to `pending`.
    accountStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      required: true,
      default: "approved",
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
