import mongoose, { Model, Schema } from "mongoose";

export interface IHospitalSetting { key: string; value: string; updatedBy?: mongoose.Types.ObjectId; createdAt: Date; updatedAt: Date; }
const HospitalSettingSchema = new Schema<IHospitalSetting>({ key: { type: String, required: true, unique: true }, value: { type: String, required: true, maxlength: 5000 }, updatedBy: { type: Schema.Types.ObjectId, ref: "User" } }, { timestamps: true, versionKey: false });
const HospitalSetting: Model<IHospitalSetting> = (mongoose.models.HospitalSetting as Model<IHospitalSetting>) || mongoose.model<IHospitalSetting>("HospitalSetting", HospitalSettingSchema);
export default HospitalSetting;
