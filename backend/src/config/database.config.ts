import dns from "dns";
import mongoose from "mongoose";
import { config } from "./app.config";

// Node's DNS resolver (c-ares) sometimes fails SRV lookups on Windows/VPN
// networks even when the system resolver works. Force a known-good DNS server
// so the mongodb+srv:// SRV lookup succeeds.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDatabase = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to Mongo database");
  } catch (error) {
    console.log("Error connecting to Mongo database");
    console.error(error);
    process.exit(1);
  }
};

export default connectDatabase;