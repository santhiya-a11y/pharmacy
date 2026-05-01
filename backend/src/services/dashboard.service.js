import { env } from "../config/env.js";
import { Sale } from "../models/Sale.js";
import { Expense } from "../models/Expense.js";
import { ProductBatch } from "../models/ProductBatch.js";
import * as reportService from "./report.service.js";
import {
  salesChartSeriesOffline,
  getDashboardSummaryOffline,
  salesSummaryOffline,
} from "./offline/analyticsOffline.js";

function dayBounds(d = new Date()) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Daily sales series for last `days` days (inclusive of today). */
export async function salesChartSeries({ days = 7 } = {}) {
  if (env.dbMode === "offline") return salesChartSeriesOffline({ days });
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = addDays(end, -(days - 1));
  start.setHours(0, 0, 0, 0);

  const pipeline = [
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: {
          y: { $year: "$date" },
          m: { $month: "$date" },
          d: { $dayOfMonth: "$date" },
        },
        sales: { $sum: "$grandTotal" },
        bills: { $sum: 1 },
      },
    },
    { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
  ];

  const rows = await Sale.aggregate(pipeline);
  const byKey = new Map();
  for (const r of rows) {
    const dt = new Date(r._id.y, r._id.m - 1, r._id.d);
    const key = dt.toISOString().slice(0, 10);
    byKey.set(key, { sales: r.sales, bills: r.bills });
  }

  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(end, -i);
    d.setHours(12, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const v = byKey.get(key) || { sales: 0, bills: 0 };
    series.push({ date: label, sales: Math.round(v.sales), bills: v.bills });
  }
  return series;
}

export async function getDashboardSummary({ from, to } = {}) {
  if (env.dbMode === "offline") {
    const summary = await getDashboardSummaryOffline();
    if (from && to) {
      summary.period = await salesSummaryOffline({ from, to });
    }
    return summary;
  }
  const { start: t0, end: t1 } = dayBounds();
  const y0 = addDays(t0, -1);
  const y1 = addDays(t1, -1);

  const [todayAgg] = await Sale.aggregate([
    { $match: { date: { $gte: t0, $lte: t1 }, status: { $ne: "void" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$items.amount" },
        profit: { 
          $sum: { 
            $subtract: [
              "$items.amount",
              { $multiply: [{ $ifNull: ["$items.purchaseRate", { $multiply: ["$items.mrp", 0.8] }] }, "$items.qty"] }
            ]
          } 
        },
        bills: { $addToSet: "$_id" },
        itemsSold: { $sum: "$items.qty" },
      },
    },
    {
      $project: {
        totalSales: 1,
        profit: 1,
        itemsSold: 1,
        bills: { $size: "$bills" },
      }
    }
  ]);

  // Fallback for bills count since the above unwind might miss empty bills (though pharmacy bills aren't empty)
  const todayTotalBills = await Sale.countDocuments({ date: { $gte: t0, $lte: t1 }, status: { $ne: "void" } });

  const [yesterdayAgg] = await Sale.aggregate([
    { $match: { date: { $gte: y0, $lte: y1 }, status: { $ne: "void" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$items.amount" },
        profit: { 
          $sum: { 
            $subtract: [
              "$items.amount",
              { $multiply: [{ $ifNull: ["$items.purchaseRate", { $multiply: ["$items.mrp", 0.8] }] }, "$items.qty"] }
            ]
          } 
        },
        itemsSold: { $sum: "$items.qty" },
      },
    },
  ]);

  const yesterdayTotalBills = await Sale.countDocuments({ date: { $gte: y0, $lte: y1 }, status: { $ne: "void" } });

  const [expenseToday] = await Expense.aggregate([
    { $match: { date: { $gte: t0, $lte: t1 } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const [expenseYesterday] = await Expense.aggregate([
    { $match: { date: { $gte: y0, $lte: y1 } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  let periodSummary = null;
  if (from && to) {
    periodSummary = await reportService.salesSummary({ from, to });
  }

  const health = await reportService.inventoryIntelligence();
  const lowStockCountAgg = await ProductBatch.aggregate([
    { $match: { qtyOnHand: { $gt: 0, $lte: 10 } } },
    { $group: { _id: "$productId" } },
    { $count: "count" }
  ]);
  const lowStockCount = lowStockCountAgg[0]?.count ?? 0;
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  const expiringValueAgg = await ProductBatch.aggregate([
    {
      $match: {
        expiryDate: { $lte: soon, $gte: new Date() },
        qtyOnHand: { $gt: 0 },
      },
    },
    { $project: { v: { $multiply: ["$qtyOnHand", "$mrp"] } } },
    { $group: { _id: null, expiringValue: { $sum: "$v" } } },
  ]);
  const expiringValue = expiringValueAgg[0]?.expiringValue ?? 0;

  const compare = (now, prev) => {
    if (!prev) return 100;
    return Math.round(((now - prev) / prev) * 100);
  };

  return {
    today: {
      sales: todayAgg?.totalSales ?? 0,
      revenue: todayAgg?.profit ?? 0, // Using 'revenue' key to map to the Dashboard's Revenue card as requested
      bills: todayTotalBills,
      itemsSold: todayAgg?.itemsSold ?? 0,
      expenses: expenseToday?.total ?? 0,
    },
    trends: {
      sales: compare(todayAgg?.totalSales || 0, yesterdayAgg?.totalSales || 0),
      revenue: compare(todayAgg?.profit || 0, yesterdayAgg?.profit || 0),
      bills: compare(todayTotalBills, yesterdayTotalBills),
      itemsSold: compare(todayAgg?.itemsSold || 0, yesterdayAgg?.itemsSold || 0),
      expenses: compare(expenseToday?.total || 0, expenseYesterday?.total || 0),
    },
    inventory: {
      ...health,
      lowStockSkus: lowStockCount,
      expiringValueApprox: Math.round(expiringValue),
      reorderSuggested: Math.min(20, lowStockCount + health.expiringSoon),
    },
    period: periodSummary,
  };
}
