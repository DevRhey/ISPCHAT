import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as IspConnectorController from "../controllers/IspConnectorController";

const ispConnectorRoutes = Router();

ispConnectorRoutes.get("/isp-connectors", isAuth, IspConnectorController.index);
ispConnectorRoutes.post("/isp-connectors", isAuth, IspConnectorController.store);
ispConnectorRoutes.put(
  "/isp-connectors/:connectorId",
  isAuth,
  IspConnectorController.update
);
ispConnectorRoutes.delete(
  "/isp-connectors/:connectorId",
  isAuth,
  IspConnectorController.remove
);
ispConnectorRoutes.post(
  "/isp-connectors/test",
  isAuth,
  IspConnectorController.testAction
);

export default ispConnectorRoutes;
