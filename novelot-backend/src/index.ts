import http from 'http'
import router from "../src/routes/router.js"
import connectDb from "./db.js"

const server = http.createServer((req, res) => {
  router.route(req, res)
})

const PORT = process.env.PORT || 1714

await connectDb();

server.listen(PORT, () => {
  console.log(`Server running on Port : ${PORT}`)

})
