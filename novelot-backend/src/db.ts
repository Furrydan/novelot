import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config();
async function connectDB() {
  if (typeof (process.env.MONGODB_URI) === "string") {
    try {
      await mongoose.connect(process.env.MONGODB_URI)
      console.log("Connected to Database")
    }
    catch {
      console.error("Connection Failed")
    }
  }
}
export default connectDB


