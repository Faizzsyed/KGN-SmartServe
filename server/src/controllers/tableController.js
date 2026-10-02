import Table from "../models/Table.js";

export async function getTables(req, res, next) {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.json({ success: true, data: tables });
  } catch (error) {
    next(error);
  }
}
