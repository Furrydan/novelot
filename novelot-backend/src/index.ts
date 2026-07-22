import app from "./app.js";
import connectDb from "./db.js"

const PORT = process.env.PORT || 1714
await connectDb();
app.listen(PORT, () => console.log(`Server Running on port ${PORT}`))
