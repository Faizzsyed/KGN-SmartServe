import Order from "../models/Order.js";
import Table from "../models/Table.js";

const orderStatuses = ["new", "preparing", "ready", "served", "completed"];

export async function getOrders(req, res, next) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req, res, next) {
  try {
    const { tableNumber, items, paymentStatus = "pending" } = req.body;
    if (!Number.isInteger(Number(tableNumber)) || Number(tableNumber) < 1 || Number(tableNumber) > 8 || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "tableNumber and at least one item are required" });
    }

    const table = await Table.findOne({ tableNumber: Number(tableNumber) });
    if (!table) return res.status(400).json({ success: false, message: "Invalid table" });

    const normalizedItems = items.map(({ name, price, quantity }) => ({ name, price, quantity }));
    const total = normalizedItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const order = await Order.create({
      tableNumber: Number(tableNumber),
      items: normalizedItems,
      total,
      paymentStatus,
      orderCode: `KGN-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    });

    table.status = "occupied";
    await table.save();
    req.app.get("io").emit("order:new", order);
    req.app.get("io").emit("table:updated", table);
    req.app.get("io").emit("dashboard:updated");
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!orderStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const io = req.app.get("io");
    if (status === "ready" || status === "served") {
      const table = await Table.findOne({ tableNumber: order.tableNumber });
      if (table) {
        table.status = status === "ready" ? "food_ready" : "occupied";
        await table.save();
        io.emit("table:updated", table);
      }
    }
    io.emit("order:updated", order);
    io.emit("dashboard:updated");
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

export async function completePayment(req, res, next) {
  try {
    const { paymentMethod } = req.body;
    if (!["cash", "upi"].includes(paymentMethod)) return res.status(400).json({ success: false, message: "Payment method must be cash or upi" });
    const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus: "paid", paymentMethod, status: "completed" }, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    const table = await Table.findOne({ tableNumber: order.tableNumber });
    if (table) { table.status = "available"; await table.save(); }
    const io = req.app.get("io");
    io.emit("order:updated", order);
    if (table) io.emit("table:updated", table);
    io.emit("dashboard:updated");
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}
