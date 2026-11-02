import { Types } from "mongoose";
import Notification from "@/models/Notification";

export async function createNotification(input: {
  userId: string | Types.ObjectId;
  type: "appointment" | "prescription" | "test_slip" | "bill" | "follow_up" | "account" | "system";
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string | Types.ObjectId;
}) {
  return Notification.create({ ...input, userId: input.userId, resourceId: input.resourceId });
}
