import mongoose from "mongoose";
import { env } from "./env.js";
import { initNedbStores, closeNedbStores } from "../db/nedb/initStores.js";

export async function connectDb() {
  if (env.dbMode === "offline") {
    await initNedbStores();
    return null;
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  return mongoose.connection;
}

export async function disconnectDb() {
  if (env.dbMode === "offline") {
    await closeNedbStores();
    return;
  }
  await mongoose.disconnect();
}
