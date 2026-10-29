
import mongoose, { Schema, Model, Types } from "mongoose";

export interface IPatient {
  userId: Types.ObjectId;
  dateOfBirth?: Date;
  phone?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  address?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: (value: Date) => value <= new Date(),
        message: "Date of birth cannot be in the future",
      },
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    emergencyContact: {
      name: { type: String, trim: true, maxlength: 100 },
      relationship: { type: String, trim: true, maxlength: 50 },
      phone: { type: String, trim: true, maxlength: 20 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Patient: Model<IPatient> =
  (mongoose.models.Patient as Model<IPatient>) ||
  mongoose.model<IPatient>("Patient", PatientSchema);

export default Patient;
