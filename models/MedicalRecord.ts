
import mongoose, { Schema, Model, Types } from "mongoose";

export interface IMedicalRecord {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  visitDate: Date;
  diagnosis: string;
  treatmentNotes?: string;
  prescriptions?: {
    medication: string;
    dosage: string;
    frequency: string;
    duration?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
    },
    visitDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    treatmentNotes: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    prescriptions: [
      {
        _id: false,
        medication: {
          type: String,
          required: true,
          trim: true,
          maxlength: 200,
        },
        dosage: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },
        frequency: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },
        duration: {
          type: String,
          trim: true,
          maxlength: 100,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const MedicalRecord: Model<IMedicalRecord> =
  (mongoose.models.MedicalRecord as Model<IMedicalRecord>) ||
  mongoose.model<IMedicalRecord>("MedicalRecord", MedicalRecordSchema);

export default MedicalRecord;
