import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDatabase } from "./config/db.js";
import MenuItem from "./models/MenuItem.js";
import Table from "./models/Table.js";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(serverDirectory, "../.env") });

const menuItems = [
  ["Chicken Biryani", "Biryani", 240, "Aromatic basmati rice with tender chicken.", 25],
  ["Mutton Biryani", "Biryani", 320, "Slow-cooked mutton biryani.", 30],
  ["Butter Chicken", "Main Course", 280, "Creamy tomato chicken curry.", 22],
  ["Chicken Tikka", "Starters", 260, "Char-grilled spiced chicken pieces.", 20],
  ["Chicken Fried Rice", "Chinese", 190, "Wok-tossed chicken fried rice.", 18],
  ["Chicken Manchurian", "Chinese", 220, "Chicken in a tangy Indo-Chinese sauce.", 18],
  ["Tandoori Roti", "Bread", 20, "Freshly baked tandoor bread.", 8],
  ["Butter Naan", "Bread", 45, "Soft naan finished with butter.", 8],
  ["Coke", "Drinks", 40, "Chilled soft drink.", 1],
  ["Mineral Water", "Drinks", 25, "Packaged drinking water.", 1],
].map(([name, category, price, description, preparationTime]) => ({ name, category, price, description, preparationTime }));

async function seed() {
  await connectDatabase();
  const menuNames = menuItems.map((item) => item.name);
  await MenuItem.deleteMany({ name: { $in: menuNames } });
  await Table.deleteMany({ tableNumber: { $nin: Array.from({ length: 8 }, (_, index) => index + 1) } });
  await MenuItem.insertMany(menuItems);
  await Table.bulkWrite(Array.from({ length: 8 }, (_, index) => ({ updateOne: { filter: { tableNumber: index + 1 }, update: { $setOnInsert: { tableNumber: index + 1, status: "available" } }, upsert: true } })));
  console.log("Seed complete: 10 sample menu items and exactly Tables 1–8 exist.");
  process.exit(0);
}

seed().catch((error) => { console.error(error.message); process.exit(1); });
