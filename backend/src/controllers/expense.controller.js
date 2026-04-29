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
    
    const [data, total, categoryData, trendData] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Expense.countDocuments(filter),
      // Category Summary
      Expense.aggregate([
        { $match: filter },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } }
      ]),
      // Last 6 months trend (we keep this as a rolling 6 month usually, but could also filter it)
      Expense.aggregate([
        {
          $match: {
            date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%b", date: "$date" } },
            amount: { $sum: "$amount" },
            sortDate: { $min: "$date" }
          }
        },
        { $sort: { sortDate: 1 } }
      ])
    ]);

    const summary = {
      total: categoryData.reduce((acc, curr) => acc + curr.total, 0),
      byCategory: categoryData.reduce((acc, curr) => {
        acc[curr._id] = curr.total;
        return acc;
      }, {}),
      trend: trendData.map(t => ({ month: t._id, amount: t.amount }))
    };

    return res.json(success(data, { page, pageSize, total, summary }));
  } catch (e) {
    next(e);
  }
}

export async function postExpense(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
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
