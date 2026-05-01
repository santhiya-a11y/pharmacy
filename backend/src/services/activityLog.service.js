import { env } from "../config/env.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { insertWithTimestamps } from "../db/nedb/documentHelpers.js";
import { getWrapped } from "../db/nedb/initStores.js";
import { toIdString } from "../db/types.js";

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
  if (env.dbMode === "offline") {
    await insertWithTimestamps(getWrapped("activitylogs"), {
      userId: userId != null ? toIdString(userId) : undefined,
      userName,
      role,
      action,
      category,
      details,
      severity,
      drugInfo,
      ip,
    });
    return;
  }
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
