import { env } from "../config/env.js";
import { deleteById, findById, insertWithTimestamps } from "../db/nedb/documentHelpers.js";
import { getWrapped } from "../db/nedb/initStores.js";
import { Expense } from "../models/Expense.js";
import { success } from "../utils/apiResponse.js";
import { z } from "zod";

const createSchema = z.object({
  category: z.string(),
  description: z.string().optional(),
  amount: z.number(),
  paidTo: z.string().optional(),
  date: z.string().optional(),
});

export async function listExpenses(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 100;
    const { from, to } = req.query;

    const filter = {};
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) {
        const d = new Date(to);
        d.setHours(23, 59, 59, 999);
        filter.date.$lte = d;
      }
    }

    const matchesFilter = (row) => {
      if (!filter.date) return true;
      const dt = new Date(row.date);
      if (filter.date.$gte && dt < filter.date.$gte) return false;
      if (filter.date.$lte && dt > filter.date.$lte) return false;
      return true;
    };

    if (env.dbMode === "offline") {
      const store = getWrapped("expenses");
      let rows = await store.find({}, { sort: { date: -1 } });
      rows = rows.filter(matchesFilter);
      const total = rows.length;
      const data = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

      const categoryDataMap = new Map();
      for (const row of rows) {
        const cat = row.category || "Other";
        categoryDataMap.set(cat, (categoryDataMap.get(cat) || 0) + Number(row.amount));
      }
      const categoryData = [...categoryDataMap.entries()].map(([k, v]) => ({ _id: k, total: v }));

      const sixMo = new Date();
      sixMo.setMonth(sixMo.getMonth() - 6);
      const trendMap = new Map();
      for (const row of await store.find({})) {
        const dt = new Date(row.date);
        if (dt < sixMo) continue;
        const label = dt.toLocaleString("en-US", { month: "short" });
        const cur = trendMap.get(label) || { amount: 0, sortDate: dt };
        cur.amount += Number(row.amount);
        if (dt < cur.sortDate) cur.sortDate = dt;
        trendMap.set(label, cur);
      }
      const trendData = [...trendMap.entries()]
        .sort((a, b) => a[1].sortDate - b[1].sortDate)
        .map(([month, v]) => ({ _id: month, amount: v.amount, sortDate: v.sortDate }));

      const summary = {
        total: categoryData.reduce((acc, curr) => acc + curr.total, 0),
        byCategory: categoryData.reduce((acc, curr) => {
          acc[curr._id] = curr.total;
          return acc;
        }, {}),
        trend: trendData.map((t) => ({ month: t._id, amount: t.amount })),
      };

      return res.json(success(data, { page, pageSize, total, summary }));
    }

    const [data, total, categoryData, trendData] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Expense.countDocuments(filter),
      Expense.aggregate([
        { $match: filter },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        {
          $match: {
            date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%b", date: "$date" } },
            amount: { $sum: "$amount" },
            sortDate: { $min: "$date" },
          },
        },
        { $sort: { sortDate: 1 } },
      ]),
    ]);

    const summary = {
      total: categoryData.reduce((acc, curr) => acc + curr.total, 0),
      byCategory: categoryData.reduce((acc, curr) => {
        acc[curr._id] = curr.total;
        return acc;
      }, {}),
      trend: trendData.map((t) => ({ month: t._id, amount: t.amount })),
    };

    return res.json(success(data, { page, pageSize, total, summary }));
  } catch (e) {
    next(e);
  }
}

export async function postExpense(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    if (env.dbMode === "offline") {
      const e = await insertWithTimestamps(getWrapped("expenses"), {
        ...body,
        expenseCode: `EXP-${Date.now()}`,
        date: body.date ? new Date(body.date) : new Date(),
      });
      return res.status(201).json(success(e));
    }
    const e = await Expense.create({
      ...body,
      expenseCode: `EXP-${Date.now()}`,
      date: body.date ? new Date(body.date) : new Date(),
    });
    return res.status(201).json(success(e));
  } catch (e) {
    next(e);
  }
}

export async function deleteExpense(req, res, next) {
  try {
    if (env.dbMode === "offline") {
      const cur = await findById(getWrapped("expenses"), req.params.id);
      if (!cur) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Expense not found" },
        });
      }
      await deleteById(getWrapped("expenses"), req.params.id);
      return res.json(success({ ok: true }));
    }
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Expense not found" },
      });
    }
    return res.json(success({ ok: true }));
  } catch (e) {
    next(e);
  }
}
