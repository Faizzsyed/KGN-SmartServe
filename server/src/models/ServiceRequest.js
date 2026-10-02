import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true, min: 1, max: 8 },
  type: { type: String, required: true, enum: ["water", "extra_plate", "tissue", "call_waiter", "bill"] },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("ServiceRequest", serviceRequestSchema);
