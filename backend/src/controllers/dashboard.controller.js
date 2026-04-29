import { success } from "../utils/apiResponse.js";
import { getDashboardSummary, salesChartSeries } from "../services/dashboard.service.js";
import * as reportService from "../services/report.service.js";

export async function getSummary(req, res, next) {
  try {
    const { from, to } = req.query;
    const data = await getDashboardSummary({ from, to });
    const detail = await reportService.detailedSalesReport({ from, to });
    const topSelling = (detail.topMedicines || []).map((t) => ({
      name: t.name,
      sold: t.qty,
      revenue: t.revenue,
      profit: t.profit,
      margin: t.margin,
    }));
    return res.json(success({ ...data, topSelling }));
  } catch (e) {
    next(e);
  }
}

export async function getCharts(req, res, next) {
  try {
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 7));
    const series = await salesChartSeries({ days });
    return res.json(success({ series, days }));
  } catch (e) {
    next(e);
  }
}
