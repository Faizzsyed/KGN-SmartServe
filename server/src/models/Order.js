import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true, min: 1 },
  orderCode: { type: String, required: true, unique: true, trim: true },
  items: { type: [orderItemSchema], required: true, validate: [(items) => items.length > 0, "An order needs at least one item"] },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["new", "preparing", "ready", "served", "completed"], default: "new" },
  paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
  paymentMethod: { type: String, enum: ["cash", "upi"], default: undefined },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);
