import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { getWrapped } from "../../db/nedb/initStores.js";
import { toIdString } from "../../db/types.js";

async function allSales() {
  return getWrapped("sales").find({});
}

async function allExpenses() {
  return getWrapped("expenses").find({});
}

async function allReturns() {
  return getWrapped("returndocs").find({});
}

async function allBatches() {
  return getWrapped("productbatches").find({});
}

async function allProducts() {
  return getWrapped("products").find({});
}

async function allLogs() {
  return getWrapped("inventorylogs").find({});
}

function saleInDateRange(s, start, end) {
  const d = new Date(s.date);
  return d >= start && d <= end && s.status !== "void";
}

function profitFromItem(it) {
  const rate = it.purchaseRate != null ? it.purchaseRate : (Number(it.mrp) || 0) * 0.8;
  return Number(it.amount) - rate * Number(it.qty);
}

export async function salesChartSeriesOffline({ days = 7 } = {}) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = subDays(end, days - 1);
  start.setHours(0, 0, 0, 0);

  const sales = await allSales();
  const byKey = new Map();
  for (const s of sales) {
    if (!saleInDateRange(s, start, end)) continue;
    const d = new Date(s.date);
    const key = d.toISOString().slice(0, 10);
    const cur = byKey.get(key) || { sales: 0, bills: 0 };
    cur.sales += Number(s.grandTotal) || 0;
    cur.bills += 1;
    byKey.set(key, cur);
  }

  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(end, i);
    d.setHours(12, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const v = byKey.get(key) || { sales: 0, bills: 0 };
    series.push({ date: label, sales: Math.round(v.sales), bills: v.bills });
  }
  return series;
}

export async function inventoryIntelligenceOffline() {
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  const deadDate = new Date();
  deadDate.setDate(deadDate.getDate() - 90);

  const batches = await allBatches();
  const products = await allProducts();
  const productById = new Map(products.map((p) => [toIdString(p._id), p]));

  let totalSkus = 0;
  let inventoryValue = 0;
  for (const b of batches) {
    const qty = Number(b.qtyOnHand) || 0;
    if (qty <= 0) continue;
    totalSkus += 1;
    inventoryValue += qty * (Number(b.purchaseRate) || 0);
  }

  const deadStock = [];
  for (const b of batches) {
    const qty = Number(b.qtyOnHand) || 0;
    if (qty <= 0) continue;
    const cr = b.createdAt ? new Date(b.createdAt) : null;
    if (!cr || cr > deadDate) continue;
    const p = productById.get(toIdString(b.productId));
    deadStock.push({
      name: p?.name || "?",
      stock: qty,
      value: qty * (Number(b.purchaseRate) || 0),
      days: Math.floor((now - cr) / 86400000),
    });
    if (deadStock.length >= 10) break;
  }

  const movementStart = subDays(startOfDay(now), 6);
  const logs = await allLogs();
  const movementMap = new Map();
  for (const log of logs) {
    const c = log.createdAt ? new Date(log.createdAt) : null;
    if (!c || c < movementStart || c > now) continue;
    const day = format(c, "yyyy-MM-dd");
    const cur = movementMap.get(day) || { in: 0, out: 0 };
    const ch = Number(log.changeQty) || 0;
    if (ch > 0) cur.in += ch;
    else cur.out += -ch;
    movementMap.set(day, cur);
  }

  let expiringSoon = 0;
  for (const b of batches) {
    const exp = b.expiryDate ? new Date(b.expiryDate) : null;
    const qty = Number(b.qtyOnHand) || 0;
    if (!exp || qty <= 0) continue;
    if (exp <= soon && exp >= now) expiringSoon += 1;
  }

  const lowPid = new Set();
  for (const b of batches) {
    const qty = Number(b.qtyOnHand) || 0;
    if (qty > 0 && qty <= 10) lowPid.add(toIdString(b.productId));
  }
  const lowStockCount = lowPid.size;

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
    totalSkus,
    inventoryValue: Math.round(inventoryValue),
    expiringSoon,
    deadStockCount: deadStock.length,
    deadStock,
    movement: movementSeries,
  };
}

/** Mirrors dashboard.service getDashboardSummary aggregation logic in JS. `period` is filled by caller via salesSummaryOffline when needed. */
export async function getDashboardSummaryOffline() {
  const { start: t0, end: t1 } = (() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  })();
  const y0 = subDays(t0, 1);
  const y1 = subDays(t1, 1);

  const sales = await allSales();

  function aggForRange(rs, re) {
    let totalSales = 0;
    let profit = 0;
    const billIds = new Set();
    let itemsSold = 0;
    for (const s of sales) {
      if (!saleInDateRange(s, rs, re)) continue;
      billIds.add(String(s._id));
      for (const it of s.items || []) {
        totalSales += Number(it.amount) || 0;
        profit += profitFromItem(it);
        itemsSold += Number(it.qty) || 0;
      }
    }
    return {
      totalSales,
      profit,
      bills: billIds.size,
      itemsSold,
    };
  }

  const todayAgg = aggForRange(t0, t1);
  const yesterdayAgg = aggForRange(y0, y1);

  let todayTotalBills = 0;
  for (const s of sales) {
    const d = new Date(s.date);
    if (d >= t0 && d <= t1 && s.status !== "void") todayTotalBills += 1;
  }
  let yesterdayTotalBills = 0;
  for (const s of sales) {
    const d = new Date(s.date);
    if (d >= y0 && d <= y1 && s.status !== "void") yesterdayTotalBills += 1;
  }

  const expenses = await allExpenses();
  let expenseToday = 0;
  let expenseYesterday = 0;
  for (const e of expenses) {
    const d = new Date(e.date);
    const amt = Number(e.amount) || 0;
    if (d >= t0 && d <= t1) expenseToday += amt;
    if (d >= y0 && d <= y1) expenseYesterday += amt;
  }

  const health = await inventoryIntelligenceOffline();

  const batches = await allBatches();
  const lowPid = new Set();
  for (const b of batches) {
    const qty = Number(b.qtyOnHand) || 0;
    if (qty > 0 && qty <= 10) lowPid.add(toIdString(b.productId));
  }
  const lowStockCount = lowPid.size;

  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  let expiringValue = 0;
  for (const b of batches) {
    const exp = b.expiryDate ? new Date(b.expiryDate) : null;
    const qty = Number(b.qtyOnHand) || 0;
    if (!exp || exp > soon || exp < new Date() || qty <= 0) continue;
    expiringValue += qty * (Number(b.mrp) || 0);
  }

  const compare = (nowV, prev) => {
    if (!prev) return 100;
    return Math.round(((nowV - prev) / prev) * 100);
  };

  return {
    today: {
      sales: todayAgg.totalSales,
      revenue: todayAgg.profit,
      bills: todayTotalBills,
      itemsSold: todayAgg.itemsSold,
      expenses: expenseToday,
    },
    trends: {
      sales: compare(todayAgg.totalSales || 0, yesterdayAgg.totalSales || 0),
      revenue: compare(todayAgg.profit || 0, yesterdayAgg.profit || 0),
      bills: compare(todayTotalBills, yesterdayTotalBills),
      itemsSold: compare(todayAgg.itemsSold || 0, yesterdayAgg.itemsSold || 0),
      expenses: compare(expenseToday || 0, expenseYesterday || 0),
    },
    inventory: {
      ...health,
      lowStockSkus: lowStockCount,
      expiringValueApprox: Math.round(expiringValue),
      reorderSuggested: Math.min(20, lowStockCount + health.expiringSoon),
    },
    period: null,
  };
}

function pctChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function salesSummaryOffline({ from, to }) {
  const start = from ? startOfDay(new Date(from)) : subDays(new Date(), 30);
  const end = to ? endOfDay(new Date(to)) : new Date();
  const periodMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - Math.max(periodMs, 0));

  const sales = await allSales();
  const returns = await allReturns();

  function aggSales(rangeStart, rangeEnd) {
    let totalRevenue = 0;
    let totalProfit = 0;
    const billIds = new Set();
    let itemsSold = 0;
    for (const s of sales) {
      const d = new Date(s.date);
      if (d < rangeStart || d > rangeEnd || s.status === "void") continue;
      billIds.add(String(s._id));
      for (const it of s.items || []) {
        totalRevenue += Number(it.amount) || 0;
        totalProfit += profitFromItem(it);
        itemsSold += Number(it.qty) || 0;
      }
    }
    return { totalRevenue, totalProfit, totalBills: billIds.size, itemsSold };
  }

  const current = aggSales(start, end);
  const previous = aggSales(prevStart, prevEnd);

  const dailyMap = new Map();
  for (const s of sales) {
    const d = new Date(s.date);
    if (d < start || d > end) continue;
    const key = format(d, "yyyy-MM-dd");
    const cur = dailyMap.get(key) || { sales: 0, bills: 0 };
    cur.sales += Number(s.grandTotal) || 0;
    cur.bills += 1;
    dailyMap.set(key, cur);
  }

  const returnDailyMap = new Map();
  for (const r of returns) {
    const c = r.createdAt ? new Date(r.createdAt) : null;
    if (!c || c < start || c > end) continue;
    if (!["approved", "completed"].includes(r.status) || r.type !== "customer") continue;
    const key = format(c, "yyyy-MM-dd");
    returnDailyMap.set(key, (returnDailyMap.get(key) || 0) + Number(r.totalAmount));
  }

  const paymentsMap = new Map();
  for (const s of sales) {
    const d = new Date(s.date);
    if (d < start || d > end) continue;
    for (const p of s.payments || []) {
      const m = p.method || "Unknown";
      paymentsMap.set(m, (paymentsMap.get(m) || 0) + Number(p.amount));
    }
  }

  const categoriesMap = new Map();
  for (const s of sales) {
    const d = new Date(s.date);
    if (d < start || d > end) continue;
    for (const it of s.items || []) {
      const cat = it.category || undefined;
      categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + Number(it.amount));
    }
  }

  const totalRev = current.totalRevenue || 1;
  const dailySales = [...dailyMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({
    date,
    sales: v.sales,
    returns: returnDailyMap.get(date) || 0,
  }));

  const payments = [...paymentsMap.entries()].map(([method, amount]) => ({
    method,
    amount,
    pct: Math.round((amount / totalRev) * 100),
  }));

  const categories = [...categoriesMap.entries()].map(([name, value]) => ({
    name: name || "General",
    value: Math.round((value / totalRev) * 100),
  }));

  const avgBill = current.totalBills ? Math.round(current.totalRevenue / current.totalBills) : 0;
  const prevAvgBill = previous.totalBills ? previous.totalRevenue / previous.totalBills : 0;

  return {
    kpi: {
      ...current,
      avgBill,
    },
    trends: {
      revenue: pctChange(current.totalRevenue || 0, previous.totalRevenue || 0),
      bills: pctChange(current.totalBills || 0, previous.totalBills || 0),
      avgBill: pctChange(avgBill, prevAvgBill),
      itemsSold: pctChange(current.itemsSold || 0, previous.itemsSold || 0),
      revenueGrowth: pctChange(current.totalRevenue || 0, previous.totalRevenue || 0),
    },
    dailySales,
    payments,
    categories,
    insights: {
      lowStockPrompt: "Use inventory intelligence to review low-stock and expiring batches.",
      stockoutDays: "N/A",
      revenueDescription: "Revenue trend is calculated from the previous matching period.",
      peakHour: "Refer sales report",
      peakHourDescription: "Peak-hour breakdown is available in the detailed sales report.",
      peakBills: current.totalBills || 0,
    },
  };
}

export async function detailedSalesReportOffline({ from, to }) {
  const start = from ? startOfDay(new Date(from)) : subDays(new Date(), 30);
  const end = to ? endOfDay(new Date(to)) : new Date();
  const sales = await allSales();

  const dailyMap = new Map();
  const hourlyMap = new Map();
  const topMap = new Map();

  for (const s of sales) {
    const d = new Date(s.date);
    if (d < start || d > end) continue;
    const dayKey = format(d, "yyyy-MM-dd");
    const cur = dailyMap.get(dayKey) || { sales: 0, discounts: 0, bills: 0 };
    cur.sales += Number(s.grandTotal) || 0;
    cur.discounts += Number(s.discountTotal ?? s.discount) || 0;
    cur.bills += 1;
    dailyMap.set(dayKey, cur);

    const h = d.getHours();
    hourlyMap.set(h, (hourlyMap.get(h) || 0) + 1);

    for (const it of s.items || []) {
      const name = it.name || "?";
      const curT = topMap.get(name) || { qty: 0, revenue: 0, profit: 0 };
      curT.qty += Number(it.qty) || 0;
      curT.revenue += Number(it.amount) || 0;
      curT.profit += profitFromItem(it);
      topMap.set(name, curT);
    }
  }

  const returns = await allReturns();
  const returnByDate = new Map();
  for (const r of returns) {
    const c = r.createdAt ? new Date(r.createdAt) : null;
    if (!c || c < start || c > end) continue;
    if (!["approved", "completed"].includes(r.status) || r.type !== "customer") continue;
    const key = format(c, "yyyy-MM-dd");
    returnByDate.set(key, (returnByDate.get(key) || 0) + Number(r.totalAmount));
  }

  const daily = [...dailyMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, v]) => ({
      date,
      sales: v.sales,
      discounts: v.discounts,
      returns: returnByDate.get(date) || 0,
      bills: v.bills,
    }));

  const hourly = [...hourlyMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([h, bills]) => ({ hour: `${h}:00`, bills }));

  const topMedicines = [...topMap.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .map(([name, t]) => ({
      name,
      qty: t.qty,
      revenue: t.revenue,
      profit: Math.round(t.profit),
      margin: t.revenue > 0 ? Math.round((t.profit / t.revenue) * 100) : 0,
    }));

  return { daily, hourly, topMedicines };
}

export async function gstReportOffline({ from, to }) {
  const start = from ? startOfDay(new Date(from)) : subDays(new Date(), 30);
  const end = to ? endOfDay(new Date(to)) : new Date();
  const sales = await allSales();

  const slabMap = new Map();
  const hsnMap = new Map();

  for (const s of sales) {
    const d = new Date(s.date);
    if (d < start || d > end) continue;
    for (const it of s.items || []) {
      const rate = (Number(it.sgst) || 0) + (Number(it.cgst) || 0);
      const cur = slabMap.get(rate) || { taxable: 0, cgst: 0, sgst: 0 };
      cur.taxable += Number(it.taxable) || 0;
      cur.cgst += Number(it.cgstAmt) || 0;
      cur.sgst += Number(it.sgstAmt) || 0;
      slabMap.set(rate, cur);

      const hsn = it.hsn || "";
      const curH = hsnMap.get(hsn) || { qty: 0, taxable: 0, rate };
      curH.qty += Number(it.qty) || 0;
      curH.taxable += Number(it.taxable) || 0;
      hsnMap.set(hsn, curH);
    }
  }

  const slabs = [...slabMap.entries()].sort((a, b) => a[0] - b[0]).map(([rate, s]) => ({ _id: rate, ...s }));

  const stats = slabs.reduce(
    (acc, curr) => ({
      taxable: acc.taxable + curr.taxable,
      totalTax: acc.totalTax + curr.cgst + curr.sgst,
      totalAmount: acc.totalAmount + curr.taxable + curr.cgst + curr.sgst,
    }),
    { taxable: 0, totalTax: 0, totalAmount: 0 }
  );

  const hsn = [...hsnMap.entries()]
    .sort((a, b) => b[1].taxable - a[1].taxable)
    .slice(0, 5)
    .map(([h, v]) => ({
      _id: h || "N/A",
      qty: v.qty,
      taxable: v.taxable,
      rate: v.rate,
    }));

  return {
    stats,
    slabs: slabs.map((s) => ({
      label: `${s._id}% GST`,
      taxable: Math.round(s.taxable),
      cgst: Math.round(s.cgst),
      sgst: Math.round(s.sgst),
      total: Math.round(s.cgst + s.sgst),
    })),
    hsn: hsn.map((h) => ({
      hsn: h._id || "N/A",
      desc: "Medicine HSN Item",
      qty: h.qty,
      taxable: Math.round(h.taxable),
      rate: h.rate,
    })),
  };
}
