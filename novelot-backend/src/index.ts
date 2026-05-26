import express from "express"
import connectDb from "./db.js"
import router from "./routes/router.js"
import cors from "cors"

const PORT = process.env.PORT || 1714
const app = express()
app.use(cors({
  origin: 'http://localhost:5173'
}))
app.use(express.json())
app.use('/api', router)

await connectDb();

app.listen(PORT, () => console.log(`Server Running on port ${PORT}`))
