
import mongoose, { Schema, Model, Types } from "mongoose";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface IAppointment {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  reason: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
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
    appointmentDate: {
      type: Date,
      required: true,
      index: true,
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
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "completed", "cancelled", "no_show"],
      default: "scheduled",
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AppointmentSchema.index({
  doctorId: 1,
  appointmentDate: 1,
  startTime: 1,
});

const Appointment: Model<IAppointment> =
  (mongoose.models.Appointment as Model<IAppointment>) ||
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);

export default Appointment;
