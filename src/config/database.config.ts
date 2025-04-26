import mongoose from "mongoose";
import { config } from "./app.config";

const connectDatabase = async ()=>{
  try {
    const connectionInstance = await mongoose.connect(config.MONGO_URI);

    console.log(`MongoDB connected!! DB host: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("Error connecting to Mongo database");
    process.exit(1);
  }
}

export default connectDatabase;