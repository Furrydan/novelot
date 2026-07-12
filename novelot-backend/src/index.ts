import express from "express"
import connectDb from "./db.js"
import router from "./routes/router.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import { errorHandler } from "./helpers/error.js"

const PORT = process.env.PORT || 1714
const app = express()
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/api', router)
app.use(errorHandler)

await connectDb();

app.listen(PORT, () => console.log(`Server Running on port ${PORT}`))
