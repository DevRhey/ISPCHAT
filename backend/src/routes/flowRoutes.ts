import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as FlowController from "../controllers/FlowController";

const flowRoutes = Router();

flowRoutes.get("/flows", isAuth, FlowController.index);
flowRoutes.post("/flows", isAuth, FlowController.store);
flowRoutes.post("/flows/templates/isp", isAuth, FlowController.importIspTemplates);
flowRoutes.post(
  "/flows/templates/master-atendimento",
  isAuth,
  FlowController.installMasterAtendimento
);
flowRoutes.post("/flows/simulate", isAuth, FlowController.simulate);
flowRoutes.get("/flows/:flowId", isAuth, FlowController.show);
flowRoutes.put("/flows/:flowId", isAuth, FlowController.update);
flowRoutes.delete("/flows/:flowId", isAuth, FlowController.remove);

export default flowRoutes;
