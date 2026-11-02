import mongoose, { Model, Schema, Types } from "mongoose";

export type PaymentStatus = "unpaid" | "partially_paid" | "paid" | "waived";
export type PaymentMethod = "cash" | "card" | "upi" | "insurance" | "other";

export interface IBill {
  billNumber: string;
  patientId: Types.ObjectId;
  appointmentId: Types.ObjectId;
  createdBy: Types.ObjectId;
  items: { category: string; description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BillSchema = new Schema<IBill>(
  {
    billNumber: { type: String, required: true, unique: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true, sparse: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        _id: false,
        category: { type: String, required: true, trim: true, maxlength: 80 },
        description: { type: String, required: true, trim: true, maxlength: 200 },
        quantity: { type: Number, required: true, min: 1, max: 1000 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ["unpaid", "partially_paid", "paid", "waived"], default: "unpaid" },
    paymentMethod: { type: String, enum: ["cash", "card", "upi", "insurance", "other"], default: "cash" },
    paidAmount: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true, versionKey: false }
);

const Bill: Model<IBill> =
  (mongoose.models.Bill as Model<IBill>) || mongoose.model<IBill>("Bill", BillSchema);

export default Bill;
