import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true, index: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    shift: { type: String, trim: true },
    joinDate: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    
    // Personal Details
    dob: { type: Date },
    gender: { type: String },
    address: { type: String },
    emergencyContact: { type: String },
    
    // Education
    qualification: { type: String },
    university: { type: String },
    graduationYear: { type: String },
    
    // Pharmacy License (if applicable)
    regNumber: { type: String },
    pharmacyCouncil: { type: String },
    licenseIssue: { type: Date },
    licenseExpiry: { type: Date },

    // ID Verification
    idType: { type: String },
    idNumber: { type: String },
    
    avatar: { type: String },
    documents: [
      {
        name: { type: String, required: true },
        type: { type: String },
        url: { type: String },
        size: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

employeeSchema.index({ name: "text", phone: "text", employeeCode: "text" });

export const Employee = mongoose.model("Employee", employeeSchema);
