import mongoose from "mongoose";

const databaseName = "kgnsmartserve";

export async function connectDatabase() {
  if (!process.env.MONGO_URI) {
    throw new Error("MongoDB connection failed: environment variable missing.");
  }

  if (mongoose.connection.readyState >= 1) {
    return;
  }


  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: databaseName, serverSelectionTimeoutMS: 10000 });
    console.log(`MongoDB connected to database: ${databaseName}`);
  } catch (error) {
    const message = String(error.message || "").toLowerCase();
    if (message.includes("authentication failed") || message.includes("bad auth")) throw new Error("MongoDB connection failed: authentication failed.");
    if (message.includes("querysrv") || message.includes("enotfound") || message.includes("getaddrinfo")) throw new Error("MongoDB connection failed: DNS/host error.");
    throw new Error("MongoDB connection failed: IP not whitelisted.");
  }
}
