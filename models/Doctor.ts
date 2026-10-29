
import mongoose, { Schema, Model, Types } from "mongoose";

export interface IDoctor {
  userId: Types.ObjectId;
  specialization: string;
  qualification: string[];
  consultationFee: number;
  experienceYears: number;
  phone?: string;
  bio?: string;
  profileImageUrl?: string;
  profileImagePublicId?: string;
  licenseNumber?: string;
  credentialDetails?: string;
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    qualification: {
      type: [String],
      required: true,
      validate: {
        validator: (items: string[]) => items.length > 0,
        message: "At least one qualification is required",
      },
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    experienceYears: {
      type: Number,
      required: true,
      min: 0,
      max: 70,
      validate: {
        validator: Number.isInteger,
        message: "Experience must be a whole number",
      },
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    profileImageUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    profileImagePublicId: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    licenseNumber: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    credentialDetails: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    availability: [
      {
        _id: false,
        dayOfWeek: {
          type: Number,
          required: true,
          min: 0,
          max: 6,
        },
        startTime: {
          type: String,
          required: true,
          match: /^([01]\d|2[0-3]):[0-5]\d$/,
        },
        endTime: {
          type: String,
          required: true,
          match: /^([01]\d|2[0-3]):[0-5]\d$/,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Doctor: Model<IDoctor> =
  (mongoose.models.Doctor as Model<IDoctor>) ||
  mongoose.model<IDoctor>("Doctor", DoctorSchema);

export default Doctor;
