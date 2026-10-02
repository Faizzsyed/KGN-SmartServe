import Order from "../models/Order.js";
import Table from "../models/Table.js";

export async function getDashboard(req, res, next) {
  try {
    const [totalOrders, activeOrders, occupiedTables, tables, recentOrders, revenueResult, items] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ["new", "preparing", "ready", "served"] } }),
      Table.countDocuments({ status: { $ne: "available" } }),
      Table.find().sort({ tableNumber: 1 }),
      Order.find().sort({ createdAt: -1 }).limit(10),
      Order.aggregate([{ $match: { status: "completed", paymentStatus: "paid" } }, { $group: { _id: null, revenue: { $sum: "$total" } } }]),
      Order.aggregate([{ $match: { status: "completed", paymentStatus: "paid" } }, { $unwind: "$items" }, { $group: { _id: "$items.name", quantity: { $sum: "$items.quantity" } } }, { $sort: { quantity: -1, _id: 1 } }, { $limit: 1 }]),
    ]);
    res.json({ success: true, data: { revenue: revenueResult[0]?.revenue || 0, totalOrders, activeOrders, occupiedTables, bestSellingItem: items[0] ? { name: items[0]._id, quantity: items[0].quantity } : null, recentOrders, tables } });
  } catch (error) {
    next(error);
  }
}
