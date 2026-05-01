import { env } from "../config/env.js";
import { getWrapped } from "../db/nedb/initStores.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { success } from "../utils/apiResponse.js";

export async function listActivity(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 50;
    const category = req.query.category;
    const filter = category ? { category } : {};

    if (env.dbMode === "offline") {
      const store = getWrapped("activitylogs");
      let rows = await store.find(filter, { sort: { createdAt: -1 } });
      const total = rows.length;
      rows = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
      return res.json(success(rows, { page, pageSize, total }));
    }

    const [data, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);
    return res.json(success(data, { page, pageSize, total }));
  } catch (e) {
    next(e);
  }
}
