import { env } from "../config/env.js";
import { Sale } from "../models/Sale.js";
import { ProductBatch } from "../models/ProductBatch.js";
import { Product } from "../models/Product.js";
import { ReturnDoc } from "../models/ReturnDoc.js";
import { InventoryLog } from "../models/InventoryLog.js";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import {
  salesSummaryOffline,
  detailedSalesReportOffline,
  gstReportOffline,
  inventoryIntelligenceOffline,
} from "./offline/analyticsOffline.js";

function pctChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function salesSummary({ from, to }) {
  if (env.dbMode === "offline") return salesSummaryOffline({ from, to });
  const start = from ? startOfDay(new Date(from)) : subDays(new Date(), 30);
  const end = to ? endOfDay(new Date(to)) : new Date();
  const periodMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - Math.max(periodMs, 0));

  const [current, daily, payments, categories, returnDaily, previous] = await Promise.all([
    Sale.aggregate([
      { $match: { date: { $gte: start, $lte: end }, status: { $ne: "void" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$items.amount" },
          totalProfit: { 
            $sum: { 
              $subtract: [
                "$items.amount",
                { $multiply: [{ $ifNull: ["$items.purchaseRate", { $multiply: ["$items.mrp", 0.8] }] }, "$items.qty"] }
              ]
            } 
          },
          totalBills: { $addToSet: "$_id" },
          itemsSold: { $sum: "$items.qty" },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalProfit: 1,
          itemsSold: 1,
          totalBills: { $size: "$totalBills" },
        }
      }
    ]),
    Sale.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          sales: { $sum: "$grandTotal" },
          bills: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]),
    Sale.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $unwind: "$payments" },
      {
        $group: {
          _id: "$payments.method",
          amount: { $sum: "$payments.amount" },
        },
      },
    ]),
    Sale.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.category",
          value: { $sum: "$items.amount" },
        },
      },
    ]),
    ReturnDoc.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ["approved", "completed"] },
          type: "customer",
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          returns: { $sum: "$totalAmount" },
        },
      },
    ]),
    Sale.aggregate([
      { $match: { date: { $gte: prevStart, $lte: prevEnd }, status: { $ne: "void" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$items.amount" },
          totalBills: { $addToSet: "$_id" },
          itemsSold: { $sum: "$items.qty" },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          itemsSold: 1,
          totalBills: { $size: "$totalBills" },
        },
      }
    ]),
  ]);

  const kpi = current[0] || { totalRevenue: 0, totalBills: 0, itemsSold: 0 };
  const prevKpi = previous[0] || { totalRevenue: 0, totalBills: 0, itemsSold: 0 };
  const totalRev = kpi.totalRevenue || 1;
  const returnMap = new Map(returnDaily.map((r) => [r._id, r.returns]));
  const avgBill = kpi.totalBills ? Math.round(kpi.totalRevenue / kpi.totalBills) : 0;
  const prevAvgBill = prevKpi.totalBills ? prevKpi.totalRevenue / prevKpi.totalBills : 0;
  
  return {
    kpi: {
      ...kpi,
      totalProfit: kpi.totalProfit || 0,
      avgBill,
    },
    trends: {
      revenue: pctChange(kpi.totalRevenue || 0, prevKpi.totalRevenue || 0),
      bills: pctChange(kpi.totalBills || 0, prevKpi.totalBills || 0),
      avgBill: pctChange(avgBill, prevAvgBill),
      itemsSold: pctChange(kpi.itemsSold || 0, prevKpi.itemsSold || 0),
      revenueGrowth: pctChange(kpi.totalRevenue || 0, prevKpi.totalRevenue || 0),
    },
    dailySales: daily.map(d => ({ date: d._id, sales: d.sales, returns: returnMap.get(d._id) || 0 })),
    payments: payments.map(p => ({
      method: p._id,
      amount: p.amount,
      pct: Math.round((p.amount / totalRev) * 100),
    })),
    categories: categories.map(c => ({
      name: c._id || "General",
      value: Math.round((c.value / totalRev) * 100),
    })),
    insights: {
      lowStockPrompt: "Use inventory intelligence to review low-stock and expiring batches.",
      stockoutDays: "N/A",
      revenueDescription: "Revenue trend is calculated from the previous matching period.",
      peakHour: "Refer sales report",
      peakHourDescription: "Peak-hour breakdown is available in the detailed sales report.",
      peakBills: kpi.totalBills || 0
    }
  };
}

export async function detailedSalesReport({ from, to }) {
  if (env.dbMode === "offline") return detailedSalesReportOffline({ from, to });
  const start = from ? startOfDay(new Date(from)) : subDays(new Date(), 30);
  const end = to ? endOfDay(new Date(to)) : new Date();

  const [daily, hourly, top] = await Promise.all([
    Sale.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          sales: { $sum: "$grandTotal" },
          discounts: { $sum: "$discountTotal" },
          bills: { $sum: 1 },
        },
      },
      { $sort: { "_id": -1 } },
    ]),
    Sale.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $hour: "$date" },
          bills: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]),
    Sale.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          qty: { $sum: "$items.qty" },
          revenue: { $sum: "$items.amount" },
          profit: { 
            $sum: { 
              $subtract: [
                "$items.amount",
                { $multiply: [{ $ifNull: ["$items.purchaseRate", { $multiply: ["$items.mrp", 0.8] }] }, "$items.qty"] }
              ]
            } 
          },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const returnByDate = await ReturnDoc.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: { $in: ["approved", "completed"] },
        type: "customer",
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        returns: { $sum: "$totalAmount" },
      },
    },
  ]);
  const returnMap = new Map(returnByDate.map((r) => [r._id, r.returns]));

  return {
    daily: daily.map(d => ({ date: d._id, sales: d.sales, discounts: d.discounts, returns: returnMap.get(d._id) || 0, bills: d.bills })),
    hourly: hourly.map(h => ({ hour: `${h._id}:00`, bills: h.bills })),
    topMedicines: top.map(t => ({ 
      name: t._id, 
      qty: t.qty, 
      revenue: t.revenue, 
      profit: Math.round(t.profit),
      margin: t.revenue > 0 ? Math.round((t.profit / t.revenue) * 100) : 0
    })),
  };
}

export async function gstReport({ from, to }) {
  if (env.dbMode === "offline") return gstReportOffline({ from, to });
  const start = from ? startOfDay(new Date(from)) : subDays(new Date(), 30);
  const end = to ? endOfDay(new Date(to)) : new Date();

  const [slabs, hsn] = await Promise.all([
    Sale.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $add: ["$items.sgst", "$items.cgst"] },
          taxable: { $sum: "$items.taxable" },
          cgst: { $sum: "$items.cgstAmt" },
          sgst: { $sum: "$items.sgstAmt" },
        },
      },
      { $sort: { "_id": 1 } },
    ]),
    Sale.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.hsn",
          qty: { $sum: "$items.qty" },
          taxable: { $sum: "$items.taxable" },
          rate: { $first: { $add: ["$items.sgst", "$items.cgst"] } },
        },
      },
      { $sort: { taxable: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const stats = slabs.reduce((acc, curr) => ({
    taxable: acc.taxable + curr.taxable,
    totalTax: acc.totalTax + curr.cgst + curr.sgst,
    totalAmount: acc.totalAmount + curr.taxable + curr.cgst + curr.sgst,
  }), { taxable: 0, totalTax: 0, totalAmount: 0 });

  return {
    stats,
    slabs: slabs.map(s => ({
      label: `${s._id}% GST`,
      taxable: Math.round(s.taxable),
      cgst: Math.round(s.cgst),
      sgst: Math.round(s.sgst),
      total: Math.round(s.cgst + s.sgst),
    })),
    hsn: hsn.map(h => ({
      hsn: h._id || "N/A",
      desc: "Medicine HSN Item",
      qty: h.qty,
      taxable: Math.round(h.taxable),
      rate: h.rate,
    })),
  };
}

export async function inventoryIntelligence() {
  if (env.dbMode === "offline") return inventoryIntelligenceOffline();
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  const deadDate = new Date();
  deadDate.setDate(deadDate.getDate() - 90);

  const movementStart = subDays(startOfDay(now), 6);
  const [stats, deadStock, movement] = await Promise.all([
    ProductBatch.aggregate([
      { $match: { qtyOnHand: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalSkus: { $sum: 1 },
          inventoryValue: { $sum: { $multiply: ["$qtyOnHand", "$purchaseRate"] } },
        },
      },
    ]),
    ProductBatch.aggregate([
      { $match: { qtyOnHand: { $gt: 0 }, createdAt: { $lte: deadDate } } },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          name: "$product.name",
          stock: "$qtyOnHand",
          value: { $multiply: ["$qtyOnHand", "$purchaseRate"] },
          days: { $floor: { $divide: [{ $subtract: [new Date(), "$createdAt"] }, 86400000] } },
        },
      },
      { $limit: 10 },
    ]),
    InventoryLog.aggregate([
      { $match: { createdAt: { $gte: movementStart, $lte: now } } },
      {
        $project: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          inQty: { $cond: [{ $gt: ["$changeQty", 0] }, "$changeQty", 0] },
          outQty: { $cond: [{ $lt: ["$changeQty", 0] }, { $multiply: ["$changeQty", -1] }, 0] },
        },
      },
      {
        $group: {
          _id: "$day",
          in: { $sum: "$inQty" },
          out: { $sum: "$outQty" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const [expiringSoon, lowStock] = await Promise.all([
    ProductBatch.countDocuments({ expiryDate: { $lte: soon, $gte: now }, qtyOnHand: { $gt: 0 } }),
    ProductBatch.aggregate([
      { $match: { qtyOnHand: { $gt: 0, $lte: 10 } } },
      { $group: { _id: "$productId" } },
      { $count: "count" }
    ]).then(res => res[0]?.count ?? 0),
  ]);

  const s = stats[0] || { totalSkus: 0, inventoryValue: 0 };

  const movementMap = new Map(movement.map((m) => [m._id, m]));
  const movementSeries = [];
  for (let i = 6; i >= 0; i--) {
    const day = subDays(now, i);
    const key = format(day, "yyyy-MM-dd");
    const m = movementMap.get(key);
    movementSeries.push({
      date: format(day, "MMM dd"),
      in: Math.round(m?.in || 0),
      out: Math.round(m?.out || 0),
    });
  }

  return {
    totalSkus: s.totalSkus,
    inventoryValue: Math.round(s.inventoryValue),
    expiringSoon,
    deadStockCount: deadStock.length,
    deadStock: deadStock,
    movement: movementSeries,
  };
}
