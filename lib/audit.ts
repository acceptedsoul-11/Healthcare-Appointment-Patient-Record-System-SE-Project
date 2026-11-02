import { Types } from "mongoose";
import AuditLog from "@/models/AuditLog";

export async function writeAuditLog(input: {
  actorId: string | Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: string | Types.ObjectId;
  metadata?: Record<string, unknown>;
}) {
  return AuditLog.create(input);
}
