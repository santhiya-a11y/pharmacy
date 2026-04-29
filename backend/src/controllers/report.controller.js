import * as reportService from "../services/report.service.js";
import { success } from "../utils/apiResponse.js";

export async function getOverview(req, res, next) {
  try {
    const { from, to } = req.query;
    const overview = await reportService.salesSummary({ from, to });
    const detail = await reportService.detailedSalesReport({ from, to });
    return res.json(success({ ...overview, topMedicines: detail.topMedicines }));
  } catch (e) {
    next(e);
  }
}

export async function getSales(req, res, next) {
  try {
    const { from, to } = req.query;
    const sales = await reportService.detailedSalesReport({ from, to });
    return res.json(success(sales));
  } catch (e) {
    next(e);
  }
}

export async function getGst(req, res, next) {
  try {
    const { from, to } = req.query;
    const gst = await reportService.gstReport({ from, to });
    return res.json(success(gst));
  } catch (e) {
    next(e);
  }
}

export async function getInventoryIntelligence(req, res, next) {
  try {
    const intelligence = await reportService.inventoryIntelligence();
    return res.json(success(intelligence));
  } catch (e) {
    next(e);
  }
}
