import { IncomingMessage, ServerResponse } from "node:http";
import novelService from "../services/novelService.js";

async function getAllNovels(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
  const novelList: string | undefined = await novelService.findAllNovels()

  if (typeof (novelList) === 'string') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(novelList)
  }
  else {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.writeHead(404, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ "message": "Not found" }))
  }
}
export default { getAllNovels }
