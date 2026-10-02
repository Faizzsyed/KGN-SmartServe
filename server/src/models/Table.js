import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true, unique: true, min: 1, max: 8 },
  status: { type: String, enum: ["available", "occupied", "food_ready", "billing"], default: "available" },
}, { timestamps: true });

export default mongoose.model("Table", tableSchema);
