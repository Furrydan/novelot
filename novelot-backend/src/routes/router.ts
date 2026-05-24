import { IncomingMessage, ServerResponse } from "http";
import novelController from "../controllers/novelController.js"

function route(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
  if (req.url === "/novels/all") {
    return novelController.getAllNovels(req, res)
  }
}
export default { route }
