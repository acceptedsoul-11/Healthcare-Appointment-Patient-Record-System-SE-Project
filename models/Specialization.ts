import mongoose, { Model, Schema } from "mongoose";

export interface ISpecialization {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SpecializationSchema = new Schema<ISpecialization>(
  { name: { type: String, required: true, unique: true, trim: true, maxlength: 100 }, isActive: { type: Boolean, default: true } },
  { timestamps: true, versionKey: false }
);

const Specialization: Model<ISpecialization> =
  (mongoose.models.Specialization as Model<ISpecialization>) || mongoose.model<ISpecialization>("Specialization", SpecializationSchema);

export default Specialization;
