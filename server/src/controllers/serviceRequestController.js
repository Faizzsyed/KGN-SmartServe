import ServiceRequest from "../models/ServiceRequest.js";
import Table from "../models/Table.js";

const requestTypes = ["water", "extra_plate", "tissue", "call_waiter", "bill"];

export async function getServiceRequests(req, res, next) {
  try {
    const requests = await ServiceRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
}

export async function createServiceRequest(req, res, next) {
  try {
    const { tableNumber, type } = req.body;
    if (!Number.isInteger(Number(tableNumber)) || Number(tableNumber) < 1 || Number(tableNumber) > 8 || !requestTypes.includes(type)) {
      return res.status(400).json({ success: false, message: "Valid tableNumber and request type are required" });
    }

    const table = await Table.findOne({ tableNumber: Number(tableNumber) });
    if (!table) return res.status(400).json({ success: false, message: "Invalid table" });

    const request = await ServiceRequest.create({ tableNumber: Number(tableNumber), type });
    const io = req.app.get("io");
    if (type === "bill") {
      table.status = "billing";
      await table.save();
      io.emit("table:updated", table);
      io.emit("dashboard:updated");
    }
    io.emit("service:new", request);
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
}

export async function completeServiceRequest(req, res, next) {
  try {
    const request = await ServiceRequest.findByIdAndUpdate(req.params.id, { status: "completed" }, { new: true });
    if (!request) return res.status(404).json({ success: false, message: "Service request not found" });
    req.app.get("io").emit("service:updated", request);
    res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
}
