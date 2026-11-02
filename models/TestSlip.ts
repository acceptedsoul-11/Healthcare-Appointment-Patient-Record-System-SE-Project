import mongoose, { Model, Schema, Types } from "mongoose";

export type TestSlipStatus = "issued" | "in_progress" | "completed" | "cancelled";

export interface ITestSlip {
  slipNumber: string;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  medicalRecordId?: Types.ObjectId;
  tests: { name: string; instructions?: string }[];
  issuedAt: Date;
  status: TestSlipStatus;
  version: number;
  isCurrent: boolean;
  supersededAt?: Date;
  supersededBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TestSlipSchema = new Schema<ITestSlip>(
  {
    slipNumber: { type: String, required: true, unique: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    medicalRecordId: { type: Schema.Types.ObjectId, ref: "MedicalRecord" },
    tests: [
      {
        _id: false,
        name: { type: String, required: true, trim: true, maxlength: 200 },
        instructions: { type: String, trim: true, maxlength: 1000 },
      },
    ],
    issuedAt: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ["issued", "in_progress", "completed", "cancelled"], default: "issued" },
    version: { type: Number, required: true, default: 1, min: 1 },
    isCurrent: { type: Boolean, required: true, default: true, index: true },
    supersededAt: Date,
    supersededBy: { type: Schema.Types.ObjectId, ref: "TestSlip" },
  },
  { timestamps: true, versionKey: false }
);

const TestSlip: Model<ITestSlip> =
  (mongoose.models.TestSlip as Model<ITestSlip>) || mongoose.model<ITestSlip>("TestSlip", TestSlipSchema);

export default TestSlip;
