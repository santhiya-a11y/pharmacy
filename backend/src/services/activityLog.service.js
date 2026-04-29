import { ActivityLog } from "../models/ActivityLog.js";

export async function writeActivityLog({
  userId,
  userName,
  role,
  action,
  category = "billing",
  details,
  severity = "info",
  drugInfo,
  ip,
  session,
}) {
  await ActivityLog.create(
    [
      {
        userId,
        userName,
        role,
        action,
        category,
        details,
        severity,
        drugInfo,
        ip,
      },
    ],
    { session }
  );
}
