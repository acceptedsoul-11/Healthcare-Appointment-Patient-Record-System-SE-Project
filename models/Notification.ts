import mongoose, { Model, Schema, Types } from "mongoose";

export type NotificationType = "appointment" | "prescription" | "test_slip" | "bill" | "follow_up" | "account" | "system";

export interface INotification {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: Types.ObjectId;
  readAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["appointment", "prescription", "test_slip", "bill", "follow_up", "account", "system"], required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    resourceType: { type: String, trim: true, maxlength: 80 },
    resourceId: { type: Schema.Types.ObjectId },
    readAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
