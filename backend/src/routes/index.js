import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/role.js";
import * as auth from "../controllers/auth.controller.js";
import * as pos from "../controllers/pos.controller.js";
import * as inventory from "../controllers/inventory.controller.js";
import * as purchase from "../controllers/purchase.controller.js";
import * as customer from "../controllers/customer.controller.js";
import * as supplier from "../controllers/supplier.controller.js";
import * as sale from "../controllers/sale.controller.js";
import * as ret from "../controllers/return.controller.js";
import * as counter from "../controllers/counter.controller.js";
import * as attendance from "../controllers/attendance.controller.js";
import * as report from "../controllers/report.controller.js";
import * as expense from "../controllers/expense.controller.js";
import * as activity from "../controllers/activity.controller.js";
import * as settings from "../controllers/settings.controller.js";
import * as salesHold from "../controllers/salesHold.controller.js";
import * as staff from "../controllers/staff.controller.js";
import * as dashboard from "../controllers/dashboard.controller.js";
import { uploadPrescription, uploadLogo } from "../middleware/upload.js";
import { success } from "../utils/apiResponse.js";
import { authLimiter, posSaleLimiter } from "../middleware/rateLimit.js";
import { Permissions } from "../middleware/permissions.js";

const r = Router();

const posPermissions = [Permissions.POS_SALE_CREATE];
const allStaffView = [Permissions.DASHBOARD_VIEW];

r.post("/auth/login", authLimiter, auth.login);
r.post("/auth/refresh", authLimiter, auth.refresh);
r.get("/auth/me", authMiddleware, auth.me);
r.post("/auth/logout", authMiddleware, auth.logout);

r.get("/dashboard/summary", authMiddleware, roleMiddleware(allStaffView), dashboard.getSummary);
r.get("/dashboard/charts", authMiddleware, roleMiddleware(allStaffView), dashboard.getCharts);

r.post("/pos/sales", posSaleLimiter, authMiddleware, roleMiddleware(posPermissions), pos.postSale);
r.get("/pos/products/search", authMiddleware, roleMiddleware([Permissions.POS_PRODUCT_SEARCH]), pos.getProductSearch);

r.get("/inventory/stock", authMiddleware, roleMiddleware([Permissions.INVENTORY_VIEW]), inventory.getStock);
r.get("/inventory/products", authMiddleware, roleMiddleware([Permissions.INVENTORY_VIEW]), inventory.getProducts);
r.get("/inventory/summary", authMiddleware, roleMiddleware([Permissions.INVENTORY_VIEW]), inventory.getSummary);
r.post("/inventory/stock", authMiddleware, roleMiddleware([Permissions.INVENTORY_EDIT]), inventory.postStock);
r.post("/inventory/products", authMiddleware, roleMiddleware([Permissions.INVENTORY_EDIT]), inventory.postProduct);
r.put("/inventory/products/:id", authMiddleware, roleMiddleware([Permissions.INVENTORY_EDIT]), inventory.putProduct);
r.post("/inventory/import", authMiddleware, roleMiddleware([Permissions.INVENTORY_EDIT]), inventory.postImport);

r.get("/purchases/orders", authMiddleware, roleMiddleware([Permissions.PURCHASE_VIEW]), purchase.listPurchases);
r.post("/purchases/orders", authMiddleware, roleMiddleware([Permissions.PURCHASE_EDIT]), purchase.postPurchase);
r.get("/purchases/orders/:id", authMiddleware, roleMiddleware([Permissions.PURCHASE_VIEW]), purchase.getPurchase);
r.post("/purchases/orders/:id/payments", authMiddleware, roleMiddleware([Permissions.PURCHASE_EDIT]), purchase.postPayment);
r.post("/purchases/orders/:id/receive", authMiddleware, roleMiddleware([Permissions.PURCHASE_EDIT]), purchase.postReceive);

r.get("/customers", authMiddleware, roleMiddleware([Permissions.CUSTOMER_VIEW]), customer.listCustomers);
r.post("/customers", authMiddleware, roleMiddleware([Permissions.CUSTOMER_EDIT]), customer.postCustomer);
r.get("/customers/:id", authMiddleware, roleMiddleware([Permissions.CUSTOMER_VIEW]), customer.getCustomer);
r.put("/customers/:id", authMiddleware, roleMiddleware([Permissions.CUSTOMER_EDIT]), customer.putCustomer);
r.delete("/customers/:id", authMiddleware, roleMiddleware([Permissions.CUSTOMER_EDIT]), customer.deleteCustomer);

r.get("/suppliers", authMiddleware, roleMiddleware([Permissions.SUPPLIER_VIEW]), supplier.listSuppliers);
r.post("/suppliers", authMiddleware, roleMiddleware([Permissions.SUPPLIER_EDIT]), supplier.postSupplier);
r.put("/suppliers/:id", authMiddleware, roleMiddleware([Permissions.SUPPLIER_EDIT]), supplier.putSupplier);
r.delete("/suppliers/:id", authMiddleware, roleMiddleware([Permissions.SUPPLIER_EDIT]), supplier.deleteSupplier);

r.get("/sales/invoices", authMiddleware, roleMiddleware([Permissions.SALES_VIEW]), sale.listInvoices);
r.get("/sales/invoices/:id", authMiddleware, roleMiddleware([Permissions.SALES_VIEW]), sale.getInvoice);

r.get("/sales/holds", authMiddleware, roleMiddleware([Permissions.SALES_HOLD_EDIT]), salesHold.listHolds);
r.post("/sales/holds", authMiddleware, roleMiddleware([Permissions.SALES_HOLD_EDIT]), salesHold.createHold);
r.delete("/sales/holds/:id", authMiddleware, roleMiddleware([Permissions.SALES_HOLD_EDIT]), salesHold.deleteHold);

r.get("/staff", authMiddleware, roleMiddleware([Permissions.STAFF_VIEW]), staff.listStaff);
r.post("/staff", authMiddleware, roleMiddleware([Permissions.STAFF_EDIT]), staff.postStaff);
r.put("/staff/:id", authMiddleware, roleMiddleware([Permissions.STAFF_EDIT]), staff.updateStaff);
r.delete("/staff/:id", authMiddleware, roleMiddleware([Permissions.STAFF_EDIT]), staff.deleteStaff);
r.post("/staff/:id/documents", authMiddleware, roleMiddleware([Permissions.STAFF_EDIT]), staff.postStaffDocument);
r.delete("/staff/:id/documents/:docId", authMiddleware, roleMiddleware([Permissions.STAFF_EDIT]), staff.deleteStaffDocument);

r.get("/returns", authMiddleware, roleMiddleware([Permissions.RETURN_VIEW]), ret.listReturns);
r.post("/returns", authMiddleware, roleMiddleware([Permissions.RETURN_CREATE]), ret.postReturn);
r.post("/returns/:id/approve", authMiddleware, roleMiddleware([Permissions.RETURN_APPROVE]), ret.approveReturn);

r.get("/counters", authMiddleware, roleMiddleware([Permissions.COUNTER_VIEW]), counter.listCounters);
r.post("/counters", authMiddleware, roleMiddleware([Permissions.COUNTER_EDIT]), counter.postCounter);
r.post("/counters/:id/login", authMiddleware, roleMiddleware([Permissions.COUNTER_EDIT]), counter.postLogin);
r.post("/counters/:id/logout", authMiddleware, roleMiddleware([Permissions.COUNTER_EDIT]), counter.postLogout);

r.post("/attendance/clock-in", authMiddleware, roleMiddleware([Permissions.ATTENDANCE_SELF]), attendance.postClockIn);
r.post("/attendance/clock-out", authMiddleware, roleMiddleware([Permissions.ATTENDANCE_SELF]), attendance.postClockOut);
r.get("/attendance/me", authMiddleware, roleMiddleware([Permissions.ATTENDANCE_SELF]), attendance.getMyAttendance);
r.get("/attendance/staff/:id", authMiddleware, roleMiddleware([Permissions.ATTENDANCE_ADMIN]), attendance.getStaffAttendance);

r.get("/reports/overview", authMiddleware, roleMiddleware([Permissions.REPORT_OVERVIEW]), report.getOverview);
r.get("/reports/sales", authMiddleware, roleMiddleware([Permissions.REPORT_SALES]), report.getSales);
r.get("/reports/gst", authMiddleware, roleMiddleware([Permissions.REPORT_GST]), report.getGst);
r.get("/reports/inventory-intelligence", authMiddleware, roleMiddleware([Permissions.REPORT_INVENTORY]), report.getInventoryIntelligence);

r.get("/expenses", authMiddleware, roleMiddleware([Permissions.EXPENSE_VIEW]), expense.listExpenses);
r.post("/expenses", authMiddleware, roleMiddleware([Permissions.EXPENSE_EDIT]), expense.postExpense);

r.get("/activity-logs", authMiddleware, roleMiddleware([Permissions.ACTIVITY_VIEW]), activity.listActivity);

r.get("/settings/:key", authMiddleware, roleMiddleware([Permissions.SETTINGS_VIEW]), settings.getSettings);
r.put("/settings", authMiddleware, roleMiddleware([Permissions.SETTINGS_EDIT]), settings.putSettings);

r.post("/uploads/prescription", authMiddleware, roleMiddleware([Permissions.UPLOAD_PRESCRIPTION]), uploadPrescription.single("file"), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "No file" } });
    const url = `/uploads/${req.file.filename}`;
    return res.json(success({ id: req.file.filename, url }));
  } catch (e) {
    next(e);
  }
});

r.post("/uploads/logo", authMiddleware, roleMiddleware([Permissions.UPLOAD_LOGO]), uploadLogo.single("file"), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "No file" } });
    const url = `/uploads/${req.file.filename}`;
    return res.json(success({ url }));
  } catch (e) {
    next(e);
  }
});

export default r;
