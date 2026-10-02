import MenuItem from "../models/MenuItem.js";

export async function getMenu(req, res, next) {
  try {
    const menuItems = await MenuItem.find().sort({ category: 1, name: 1 });
    res.json({ success: true, data: menuItems });
  } catch (error) {
    next(error);
  }
}
