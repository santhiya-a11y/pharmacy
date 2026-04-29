import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    permissions: [{ type: String }],
  },
  { timestamps: true }
);

export const Role = mongoose.model("Role", roleSchema);
