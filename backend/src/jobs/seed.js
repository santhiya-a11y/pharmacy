/**
 * Full database seeder — pharmacy POS dummy data.
 *
 * Usage:
 *   npm run seed
 *   npm run seed -- --clear     # wipe seeded collections first, then insert
 *
 * Seed login password is read from SEED_DEFAULT_PASSWORD.
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { pathToFileURL } from "url";
import { loadEnv, env } from "../config/env.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { COLLECTION_KEYS, getWrapped } from "../db/nedb/initStores.js";
import { insertWithTimestamps } from "../db/nedb/documentHelpers.js";
import { toIdString } from "../db/types.js";
import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { Employee } from "../models/Employee.js";
import { Supplier } from "../models/Supplier.js";
import { Product } from "../models/Product.js";
import { ProductBatch } from "../models/ProductBatch.js";
import { Customer } from "../models/Customer.js";
import { Counter } from "../models/Counter.js";
import { StoreSettings } from "../models/StoreSettings.js";
import { Sale } from "../models/Sale.js";
import { SaleHold } from "../models/SaleHold.js";
import { CounterSeq } from "../models/CounterSeq.js";
import { RolePermissions } from "../middleware/permissions.js";

loadEnv();

const CLEAR_FLAG = process.argv.includes("--clear");

/** Split total GST % into SGST + CGST (intra-state). */
function splitGstPct(totalPct) {
  const half = totalPct / 2;
  return { sgstPct: half, cgstPct: half };
}

const ROLES = ["Admin", "Pharmacist", "Cashier", "Inventory Manager"];

/**
 * 40 medicines — category, HSN, GST % (5 / 12 / 18), Rx flag.
 * defaultGstPct must match splitGstPct usage for batches.
 */
const MEDICINES = [
  { name: "Dolo 650mg", generic: "Paracetamol", mfr: "Micro Labs", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Paracetamol 500mg", generic: "Paracetamol", mfr: "Cipla Ltd", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Crocin Advance", generic: "Paracetamol", mfr: "GSK", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Calpol 650", generic: "Paracetamol", mfr: "GSK", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Combiflam", generic: "Paracetamol + Ibuprofen", mfr: "Sanofi", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Brufen 400mg", generic: "Ibuprofen", mfr: "Abbott", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Voveran SR 100", generic: "Diclofenac", mfr: "Novartis", cat: "Tablet", hsn: "3004", gst: 12, rx: true },
  { name: "Azithral 500", generic: "Azithromycin", mfr: "Alembic", cat: "Tablet", hsn: "3004", gst: 12, rx: true },
  { name: "Azee 500", generic: "Azithromycin", mfr: "Cipla Ltd", cat: "Tablet", hsn: "3004", gst: 12, rx: true },
  { name: "Augmentin 625 Duo", generic: "Amoxicillin + Clavulanate", mfr: "GSK", cat: "Tablet", hsn: "3004", gst: 12, rx: true },
  { name: "Amoxyclav 625", generic: "Amoxicillin + Clavulanate", mfr: "Abbott", cat: "Tablet", hsn: "3004", gst: 12, rx: true },
  { name: "Monocef O 200", generic: "Cefpodoxime", mfr: "Aristo", cat: "Tablet", hsn: "3004", gst: 12, rx: true },
  { name: "Taxim O 200", generic: "Cefixime", mfr: "Alkem", cat: "Tablet", hsn: "3004", gst: 12, rx: true },
  { name: "Allegra 120", generic: "Fexofenadine", mfr: "Sanofi", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Montair LC", generic: "Montelukast + Levocetirizine", mfr: "Cipla Ltd", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Pantocid DSR", generic: "Pantoprazole", mfr: "Sun Pharma", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Rantac 150", generic: "Ranitidine", mfr: "J&J", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Omez 20", generic: "Omeprazole", mfr: "Dr Reddy's", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Metformin 500 SR", generic: "Metformin", mfr: "USV", cat: "Tablet", hsn: "3004", gst: 12, rx: true },
  { name: "Glycomet GP1", generic: "Metformin + Glimepiride", mfr: "USV", cat: "Tablet", hsn: "3004", gst: 12, rx: true },
  { name: "Telma 40", generic: "Telmisartan", mfr: "Glenmark", cat: "Tablet", hsn: "3004", gst: 12, rx: true },
  { name: "Amlong 5", generic: "Amlodipine", mfr: "Micro Labs", cat: "Tablet", hsn: "3004", gst: 12, rx: true },
  { name: "Atorva 10", generic: "Atorvastatin", mfr: "Zydus", cat: "Tablet", hsn: "3004", gst: 12, rx: true },
  { name: "Ecosprin 75", generic: "Aspirin", mfr: "USV", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Shelcal 500", generic: "Calcium + Vitamin D3", mfr: "Torrent", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Zincovit", generic: "Multivitamin + Zinc", mfr: "Apex", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Becosules", generic: "Vitamin B-complex", mfr: "Pfizer", cat: "Capsule", hsn: "3004", gst: 12, rx: false },
  { name: "Duphalac L", generic: "Lactulose", mfr: "Abbott", cat: "Syrup", hsn: "3004", gst: 12, rx: false },
  { name: "Ascoril LS", generic: "Ambroxol + Levosalbutamol", mfr: "Glenmark", cat: "Syrup", hsn: "3004", gst: 12, rx: false },
  { name: "Benadryl", generic: "Diphenhydramine", mfr: "J&J", cat: "Syrup", hsn: "3004", gst: 12, rx: false },
  { name: "Zinc syrup", generic: "Zinc", mfr: "Himalaya", cat: "Syrup", hsn: "3004", gst: 5, rx: false },
  { name: "ORS L", generic: "Oral Rehydration Salts", mfr: "WHO", cat: "Syrup", hsn: "3004", gst: 5, rx: false },
  { name: "Insulin Actrapid", generic: "Insulin soluble", mfr: "Novo Nordisk", cat: "Injection", hsn: "3004", gst: 12, rx: true },
  { name: "Mixtard 30", generic: "Insulin biphasic", mfr: "Novo Nordisk", cat: "Injection", hsn: "3004", gst: 12, rx: true },
  { name: "Ceftriaxone 1g IM", generic: "Ceftriaxone", mfr: "Alkem", cat: "Injection", hsn: "3004", gst: 12, rx: true },
  { name: "Pantoprazole 40 IV", generic: "Pantoprazole", mfr: "Aristo", cat: "Injection", hsn: "3004", gst: 12, rx: true },
  { name: "Diclofenac 3ml", generic: "Diclofenac", mfr: "Novartis", cat: "Injection", hsn: "3004", gst: 12, rx: true },
  { name: "Vitamin D3 60k", generic: "Cholecalciferol", mfr: "Torrent", cat: "Capsule", hsn: "3004", gst: 18, rx: false },
  { name: "Whey Protein 1kg", generic: "Protein supplement", mfr: "Optimum", cat: "Tablet", hsn: "2106", gst: 18, rx: false },
  { name: "Electral powder", generic: "ORS powder", mfr: "WHO", cat: "Tablet", hsn: "3004", gst: 5, rx: false },
  { name: "Cetirizine 10mg", generic: "Cetirizine", mfr: "Dr Reddy's", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Levocetirizine 5mg", generic: "Levocetirizine", mfr: "Sun Pharma", cat: "Tablet", hsn: "3004", gst: 12, rx: false },
  { name: "Dexorange", generic: "Iron + Folic + B12", mfr: "Franco-Indian", cat: "Syrup", hsn: "3004", gst: 12, rx: false },
];

const SUPPLIERS_DATA = [
  { code: "SUP-001", name: "MedPharma Distributors", person: "Rajesh Kumar", phone: "9820011001", email: "orders@medpharma.in", gst: "27AABCM1234L1Z5", addr: "Bhiwandi, Maharashtra" },
  { code: "SUP-002", name: "HealthLine Agencies", person: "Sunita Patil", phone: "9820011002", email: "hl@healthline.in", gst: "27AABCH5678L2Z1", addr: "Andheri East, Mumbai" },
  { code: "SUP-003", name: "Prime Surgicals", person: "Amit Shah", phone: "9820011003", email: "prime@surg.in", gst: "27AABCP9012L3Z8", addr: "Pune Camp, Maharashtra" },
  { code: "SUP-004", name: "Apollo Wholesale", person: "Neha Desai", phone: "9820011004", email: "wh@apollo.in", gst: "27AABCA3456L4Z2", addr: "Hyderabad, Telangana" },
  { code: "SUP-005", name: "Cipla Trade Centre", person: "Vikram Singh", phone: "9820011005", email: "trade@cipla.in", gst: "27AABCC7890L5Z3", addr: "Verna, Goa" },
  { code: "SUP-006", name: "Sun Pharma Supply", person: "Kavita Rao", phone: "9820011006", email: "supply@sunpharma.in", gst: "27AABCS1122L6Z4", addr: "Mohali, Punjab" },
  { code: "SUP-007", name: "Mankind Pharma Dist.", person: "Rahul Verma", phone: "9820011007", email: "dist@mankind.in", gst: "27AABCM3344L7Z5", addr: "Delhi NCR" },
  { code: "SUP-008", name: "Zydus Channel Partners", person: "Pooja Nair", phone: "9820011008", email: "cp@zydus.in", gst: "27AABCZ5566L8Z6", addr: "Ahmedabad, Gujarat" },
  { code: "SUP-009", name: "Lupin Logistics", person: "Suresh Iyer", phone: "9820011009", email: "log@lupin.in", gst: "27AABCL7788L9Z7", addr: "Indore, MP" },
  { code: "SUP-010", name: "Torrent Pharma Trade", person: "Meera Joshi", phone: "9820011010", email: "trade@torrent.in", gst: "27AABCT9900L1Z8", addr: "Ahmedabad, Gujarat" },
  { code: "SUP-011", name: "Dr Reddy's Wholesale", person: "Arjun Menon", phone: "9820011011", email: "wh@drreddys.com", gst: "27AABCD1122L2Z9", addr: "Hyderabad, Telangana" },
  { code: "SUP-012", name: "Alkem Laboratories Dist.", person: "Divya Kulkarni", phone: "9820011012", email: "dist@alkem.in", gst: "27AABCA3344L3Z1", addr: "Mumbai, Maharashtra" },
];

export async function clearOfflineCollections() {
  console.log("Clearing NeDB collections (--clear)...");
  for (const key of COLLECTION_KEYS) {
    await getWrapped(key).remove({}, { multi: true });
  }
  console.log("NeDB clear done.");
}

async function clearCollections() {
  console.log("Clearing collections (--clear)...");
  await SaleHold.deleteMany({});
  await Sale.deleteMany({});
  await ProductBatch.deleteMany({});
  await Product.deleteMany({});
  await Customer.deleteMany({});
  await Counter.deleteMany({});
  await User.deleteMany({});
  await Employee.deleteMany({});
  await Supplier.deleteMany({});
  await StoreSettings.deleteMany({});
  await Role.deleteMany({});
  await CounterSeq.deleteMany({});
  console.log("Clear done.");
}

async function seedRoles() {
  const roleDocs = {};
  if (env.dbMode === "offline") {
    const store = getWrapped("roles");
    for (const name of ROLES) {
      const r = await insertWithTimestamps(store, { name, permissions: RolePermissions[name] || [] });
      roleDocs[name] = r;
    }
    return roleDocs;
  }
  for (const name of ROLES) {
    const r = await Role.create({ name, permissions: RolePermissions[name] || [] });
    roleDocs[name] = r;
  }
  return roleDocs;
}

async function seedEmployees() {
  const list = [
    { code: "EMP-001", name: "Priya Sharma", roleLabel: "Admin", phone: "9876543210", email: "priya@pharmacare.in", shift: "Full Day" },
    { code: "EMP-002", name: "Ravi Nair", roleLabel: "Cashier", phone: "9876543211", email: "ravi@pharmacare.in", shift: "Morning" },
    { code: "EMP-003", name: "Sneha Kulkarni", roleLabel: "Cashier", phone: "9876543212", email: "sneha@pharmacare.in", shift: "Evening" },
    { code: "EMP-004", name: "Dr. Amit Deshpande", roleLabel: "Pharmacist", phone: "9876543213", email: "amit@pharmacare.in", shift: "Full Day" },
    { code: "EMP-005", name: "Vikram Patil", roleLabel: "Inventory Manager", phone: "9876543214", email: "vikram@pharmacare.in", shift: "Full Day" },
  ];
  const map = {};
  if (env.dbMode === "offline") {
    const store = getWrapped("employees");
    for (const e of list) {
      const doc = await insertWithTimestamps(store, {
        employeeCode: e.code,
        name: e.name,
        role: e.roleLabel,
        phone: e.phone,
        email: e.email,
        status: "active",
        shift: e.shift,
        joinDate: new Date("2023-04-01"),
        documents: [],
      });
      map[e.code] = doc;
    }
    return map;
  }
  for (const e of list) {
    const doc = await Employee.create({
      employeeCode: e.code,
      name: e.name,
      roleLabel: e.roleLabel,
      phone: e.phone,
      email: e.email,
      status: "active",
      shift: e.shift,
      joinDate: new Date("2023-04-01"),
    });
    map[e.code] = doc;
  }
  return map;
}

async function seedUsers(roleDocs, employees, passwordHash) {
  const rows = [
    { email: "admin@pharmacare.in", role: "Admin", emp: "EMP-001" },
    { email: "cashier1@pharmacare.in", role: "Cashier", emp: "EMP-002" },
    { email: "cashier2@pharmacare.in", role: "Cashier", emp: "EMP-003" },
    { email: "pharmacist@pharmacare.in", role: "Pharmacist", emp: "EMP-004" },
    { email: "inventory@pharmacare.in", role: "Inventory Manager", emp: "EMP-005" },
  ];
  if (env.dbMode === "offline") {
    const usersStore = getWrapped("users");
    const empStore = getWrapped("employees");
    for (const u of rows) {
      const user = await insertWithTimestamps(usersStore, {
        email: u.email.toLowerCase(),
        passwordHash,
        roleId: toIdString(roleDocs[u.role]._id),
        employeeId: toIdString(employees[u.emp]._id),
        isActive: true,
        refreshTokenVersion: 0,
      });
      await empStore.update(
        { _id: employees[u.emp]._id },
        { $set: { userId: user._id, updatedAt: new Date() } },
        {}
      );
    }
    return;
  }
  for (const u of rows) {
    const user = await User.create({
      email: u.email.toLowerCase(),
      passwordHash,
      roleId: roleDocs[u.role]._id,
      employeeId: employees[u.emp]._id,
      isActive: true,
      refreshTokenVersion: 0,
    });
    await Employee.findByIdAndUpdate(employees[u.emp]._id, { userId: user._id });
  }
}

async function seedSuppliers() {
  const docs = [];
  if (env.dbMode === "offline") {
    const store = getWrapped("suppliers");
    for (const s of SUPPLIERS_DATA) {
      docs.push(
        await insertWithTimestamps(store, {
          supplierCode: s.code,
          name: s.name,
          contactPerson: s.person,
          phone: s.phone,
          email: s.email,
          location: s.addr,
          gst: s.gst,
          rating: 4 + Math.random() * 0.9,
          categories: ["Medicines", "Surgicals"],
          totalOrders: 0,
          totalValue: 0,
          outstandingAmount: 0,
          creditDays: 0,
        })
      );
    }
    return docs;
  }
  for (const s of SUPPLIERS_DATA) {
    docs.push(
      await Supplier.create({
        supplierCode: s.code,
        name: s.name,
        contactPerson: s.person,
        phone: s.phone,
        email: s.email,
        location: s.addr,
        gst: s.gst,
        rating: 4 + (Math.random() * 0.9),
        categories: ["Medicines", "Surgicals"],
      })
    );
  }
  return docs;
}

function addMonths(d, m) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
}

function addDays(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

/**
 * Build 2–3 batches per product with mixed stock / expiry / status.
 */
async function seedProductsAndBatches(suppliers) {
  const racks = ["A1", "A2", "B1", "B2", "C1", "D1", "Cold-1"];
  const now = new Date();
  const productStore = env.dbMode === "offline" ? getWrapped("products") : null;
  const batchStore = env.dbMode === "offline" ? getWrapped("productbatches") : null;

  for (let i = 0; i < MEDICINES.length; i++) {
    const m = MEDICINES[i];
    const productPayload = {
      name: m.name,
      description: `${m.generic} — ${m.cat}`,
      genericName: m.generic,
      manufacturer: m.mfr,
      hsn: m.hsn,
      category: m.cat,
      requiresRx: m.rx,
      defaultGstPct: m.gst,
    };
    const p =
      env.dbMode === "offline"
        ? await insertWithTimestamps(productStore, productPayload)
        : await Product.create(productPayload);

    const sup = suppliers[i % suppliers.length];
    const gst = splitGstPct(m.gst);
    const baseMrp = 20 + (i % 15) * 8 + Math.floor(i / 10) * 12;

    const batchPlans = [
      {
        batchNo: `${String.fromCharCode(65 + (i % 26))}${100 + i}-1`,
        expiry: addMonths(now, 14 + (i % 8)),
        mrp: baseMrp,
        qty: 80 + (i % 40),
        rack: racks[i % racks.length],
      },
      {
        batchNo: `${String.fromCharCode(65 + (i % 26))}${100 + i}-2`,
        expiry: addDays(now, 25 + (i % 20)),
        mrp: baseMrp + 5,
        qty: i % 4 === 0 ? 8 : 24 + (i % 12),
        rack: racks[(i + 1) % racks.length],
      },
    ];

    if (i % 3 === 0) {
      batchPlans.push({
        batchNo: `${String.fromCharCode(65 + (i % 26))}${100 + i}-X`,
        expiry: addDays(now, -45 - (i % 30)),
        mrp: baseMrp - 2,
        qty: Math.max(0, 3 + (i % 5)),
        rack: "RETURNS",
      });
    }

    for (let b = 0; b < batchPlans.length; b++) {
      const plan = batchPlans[b];
      const { expiryDate, status } = (() => {
        const exp = plan.expiry;
        const t = exp.getTime();
        let st = "safe";
        if (t < now.getTime()) st = "expired";
        else if (t < addDays(now, 60).getTime()) st = "expiring";
        if (plan.qty < 12 && st === "safe") st = "low";
        if (st === "expiring" && plan.qty < 10) st = "low";
        return { expiryDate: exp, status: st };
      })();

      const batchPayload = {
        productId: env.dbMode === "offline" ? toIdString(p._id) : p._id,
        supplierId: env.dbMode === "offline" ? toIdString(sup._id) : sup._id,
        batchNo: plan.batchNo,
        expiryDate,
        mrp: plan.mrp,
        purchaseRate: Math.round(plan.mrp * (0.55 + b * 0.03) * 100) / 100,
        sgstPct: gst.sgstPct,
        cgstPct: gst.cgstPct,
        rack: plan.rack,
        qtyOnHand: status === "expired" ? Math.min(plan.qty, 5) : plan.qty,
        status,
      };

      if (env.dbMode === "offline") {
        await insertWithTimestamps(batchStore, batchPayload);
      } else {
        await ProductBatch.create(batchPayload);
      }
    }
  }
}

async function seedCustomers() {
  const first = ["Rajesh", "Priya", "Amit", "Sneha", "Vikram", "Kavita", "Rahul", "Anita", "Suresh", "Meera"];
  const last = ["Kumar", "Sharma", "Patil", "Desai", "Iyer", "Nair", "Verma", "Joshi", "Menon", "Kulkarni"];

  if (env.dbMode === "offline") {
    const store = getWrapped("customers");
    for (let i = 0; i < 24; i++) {
      const phone = `98${String(76543200 + i).padStart(8, "0")}`;
      const types = ["regular", "regular", "vip", "credit"];
      const type = types[i % types.length];
      await insertWithTimestamps(store, {
        customerCode: `CUST-${String(i + 1).padStart(3, "0")}`,
        name: `${first[i % first.length]} ${last[(i + 3) % last.length]}`,
        phone,
        email: i % 3 === 0 ? `cust${i + 1}@email.in` : undefined,
        address: `${100 + i} MG Road, Mumbai`,
        loyaltyPoints: (i * 17) % 850,
        creditBalance: type === "credit" ? 200 + (i % 5) * 150 : 0,
        totalPurchases: 5000 + i * 400,
        type,
        lastVisit: addDays(new Date(), -i),
      });
    }
    return;
  }

  for (let i = 0; i < 24; i++) {
    const phone = `98${String(76543200 + i).padStart(8, "0")}`;
    const types = ["regular", "regular", "vip", "credit"];
    const type = types[i % types.length];
    await Customer.create({
      customerCode: `CUST-${String(i + 1).padStart(3, "0")}`,
      name: `${first[i % first.length]} ${last[(i + 3) % last.length]}`,
      phone,
      email: i % 3 === 0 ? `cust${i + 1}@email.in` : undefined,
      address: `${100 + i} MG Road, Mumbai`,
      loyaltyPoints: (i * 17) % 850,
      creditBalance: type === "credit" ? 200 + (i % 5) * 150 : 0,
      totalPurchases: 5000 + i * 400,
      type,
      lastVisit: addDays(new Date(), -i),
    });
  }
}

async function seedCounters() {
  if (env.dbMode === "offline") {
    const store = getWrapped("counters");
    await insertWithTimestamps(store, {
      name: "Counter 1",
      location: "Ground Floor — Billing",
      status: "closed",
      todaySales: 0,
      todayTransactions: 0,
    });
    await insertWithTimestamps(store, {
      name: "Counter 2",
      location: "Ground Floor — Express",
      status: "closed",
      todaySales: 0,
      todayTransactions: 0,
    });
    return;
  }
  await Counter.create({
    name: "Counter 1",
    location: "Ground Floor — Billing",
    status: "closed",
  });
  await Counter.create({
    name: "Counter 2",
    location: "Ground Floor — Express",
    status: "closed",
  });
}

async function seedSettings() {
  const billing = {
    key: "billing",
    value: {
      invoicePrefix: "INV-",
      defaultGst: 12,
      roundOff: true,
      footerNote: "Goods once sold will not be taken back. Subject to jurisdiction of Mumbai.",
    },
  };
  const store = {
    key: "store",
    value: {
      storeName: "PharmaCare Medical & General Stores",
      tagline: "Your neighbourhood pharmacy",
      address: "Shop 12–14, Laxmi Plaza, Andheri West, Mumbai 400058",
      phone: "022-12345678",
      email: "care@pharmacare.in",
      gstin: "27AAAAA0000A1Z5",
      drugLicense: "MH-MUM-123456",
    },
  };
  const gst = {
    key: "gst",
    value: {
      defaultIntraState: 12,
      slabs: [5, 12, 18],
      includeGstInMrp: true,
    },
  };
  const invoice = {
    key: "invoice",
    value: {
      showHsn: true,
      showBatch: true,
      showExpiry: true,
      duplicateCopy: true,
    },
  };

  if (env.dbMode === "offline") {
    const st = getWrapped("storesettings");
    await insertWithTimestamps(st, billing);
    await insertWithTimestamps(st, store);
    await insertWithTimestamps(st, gst);
    await insertWithTimestamps(st, invoice);
    return;
  }

  await StoreSettings.create(billing);
  await StoreSettings.create(store);
  await StoreSettings.create(gst);
  await StoreSettings.create(invoice);
}

/** Full offline demo seed; NeDB must be initialized first. */
export async function executeOfflineSeed(passwordPlain) {
  const pwd = String(passwordPlain ?? "");
  if (pwd.length < 8) {
    throw new Error("Password must be at least 8 characters for seeding users");
  }
  const passwordHash = await bcrypt.hash(pwd, 10);
  const roleDocs = await seedRoles();
  const employees = await seedEmployees();
  await seedUsers(roleDocs, employees, passwordHash);
  const suppliers = await seedSuppliers();
  await seedProductsAndBatches(suppliers);
  await seedCustomers();
  await seedCounters();
  await seedSettings();
}

async function run() {
  await connectDb();

  if (env.dbMode === "offline") {
    if (CLEAR_FLAG) {
      await clearOfflineCollections();
    } else if ((await getWrapped("roles").count({})) > 0) {
      console.log("NeDB already contains seed data. To wipe and re-seed, run: npm run seed -- --clear");
      await disconnectDb();
      process.exit(0);
    }

    const defaultPassword = process.env.SEED_DEFAULT_PASSWORD;
    if (!defaultPassword || defaultPassword.length < 8) {
      throw new Error("SEED_DEFAULT_PASSWORD (min 8 chars) is required for seeding users");
    }
    await executeOfflineSeed(defaultPassword);

    console.log("");
    console.log("NeDB seed complete.");
    console.log("  Users (password from SEED_DEFAULT_PASSWORD):");
    console.log("    admin@pharmacare.in (Admin)");
    console.log("    cashier1@pharmacare.in, cashier2@pharmacare.in (Cashier)");
    console.log("    pharmacist@pharmacare.in (Pharmacist)");
    console.log("    inventory@pharmacare.in (Inventory Manager)");
    console.log(`  Products: ${MEDICINES.length} | Batches: ~2–3 each | Customers: 24 | Suppliers: ${SUPPLIERS_DATA.length}`);
    console.log("");

    await disconnectDb();
    process.exit(0);
  }

  if (CLEAR_FLAG) {
    await clearCollections();
  } else if ((await Role.countDocuments()) > 0) {
    console.log("Database already contains seed data. To wipe and re-seed, run: npm run seed -- --clear");
    await disconnectDb();
    process.exit(0);
  }

  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD;
  if (!defaultPassword || defaultPassword.length < 8) {
    throw new Error("SEED_DEFAULT_PASSWORD (min 8 chars) is required for seeding users");
  }
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const roleDocs = await seedRoles();
  const employees = await seedEmployees();
  await seedUsers(roleDocs, employees, passwordHash);
  const suppliers = await seedSuppliers();
  await seedProductsAndBatches(suppliers);
  await seedCustomers();
  await seedCounters();
  await seedSettings();

  console.log("");
  console.log("Seed complete.");
  console.log("  Users (password from SEED_DEFAULT_PASSWORD):");
  console.log("    admin@pharmacare.in (Admin)");
  console.log("    cashier1@pharmacare.in, cashier2@pharmacare.in (Cashier)");
  console.log("    pharmacist@pharmacare.in (Pharmacist)");
  console.log("    inventory@pharmacare.in (Inventory Manager)");
  console.log(`  Products: ${MEDICINES.length} | Batches: ~2–3 each | Customers: 24 | Suppliers: ${SUPPLIERS_DATA.length}`);
  console.log("");

  await disconnectDb();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
