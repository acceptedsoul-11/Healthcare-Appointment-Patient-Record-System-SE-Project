import mongoose, { Model, Schema, Types } from "mongoose";

export interface IMedicalReport {
  patientId: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalReportSchema = new Schema<IMedicalReport>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    fileName: { type: String, required: true, trim: true, maxlength: 180 },
    mimeType: { type: String, required: true, enum: ["application/pdf", "image/jpeg", "image/png", "image/webp"] },
    size: { type: Number, required: true, min: 1, max: 10 * 1024 * 1024 },
    storageKey: { type: String, required: true, unique: true },
    description: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false }
);

const MedicalReport: Model<IMedicalReport> =
  (mongoose.models.MedicalReport as Model<IMedicalReport>) || mongoose.model<IMedicalReport>("MedicalReport", MedicalReportSchema);

export default MedicalReport;
