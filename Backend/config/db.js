import dns from "dns";
import mongoose from "mongoose";

mongoose.set("bufferCommands", false);
mongoose.set("sanitizeFilter", true);
mongoose.set("strictQuery", true);

export const isDBConnected = () => mongoose.connection.readyState === 1;

export const getDBHealth = () => ({
  ready: isDBConnected(),
  state: mongoose.connection.readyState,
});

export const requireDBConnection = (req, res, next) => {
  if (!isDBConnected()) {
    return res.status(503).json({
      message: "Database chưa kết nối. Kiểm tra MONGODB_URI hoặc MongoDB server.",
    });
  }

  next();
};

const connectDB = async ({ uri = process.env.MONGODB_URI } = {}) => {
  const dnsServers = process.env.DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  if (dnsServers?.length) {
    dns.setServers(dnsServers);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`, { cause: error });
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

export default connectDB;
