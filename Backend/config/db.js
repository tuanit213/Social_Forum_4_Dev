import dns from "dns";
import mongoose from "mongoose";

mongoose.set("bufferCommands", false);
mongoose.set("sanitizeFilter", true);
mongoose.set("strictQuery", true);

export const isDBConnected = () => mongoose.connection.readyState === 1;

export const requireDBConnection = (req, res, next) => {
  if (!isDBConnected()) {
    return res.status(503).json({
      message: "Database chưa kết nối. Kiểm tra MONGODB_URI hoặc MongoDB server.",
    });
  }

  next();
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const dnsServers = process.env.DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (!uri) {
    console.warn("Cảnh báo: MONGODB_URI đang trống. API cần database sẽ không lưu được dữ liệu.");
    return false;
  }

  if (dnsServers?.length) {
    dns.setServers(dnsServers);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Lỗi kết nối MongoDB: ${error.message}`);
    return false;
  }
};

export default connectDB;
