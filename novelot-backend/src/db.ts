import mongoose from "mongoose"

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable not found!")
  }
  await mongoose.connect(process.env.MONGODB_URI)
  console.log("Connected to Database")
  console.log("collections", await mongoose.connection.db?.listCollections().toArray())


}
export default connectDB


