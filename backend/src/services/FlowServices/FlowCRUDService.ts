import { Op } from "sequelize";
import Flow from "../../models/Flow";
import FlowNode from "../../models/FlowNode";
import FlowEdge from "../../models/FlowEdge";
import AppError from "../../errors/AppError";

interface ListParams {
  companyId: number;
  searchParam?: string;
}

export const ListFlowsService = async ({
  companyId,
  searchParam
}: ListParams): Promise<Flow[]> => {
  const where: any = { companyId };
  if (searchParam) {
    where.name = { [Op.iLike]: `%${searchParam}%` };
  }
  return Flow.findAll({
    where,
    include: [
      { model: FlowNode, as: "nodes" },
      { model: FlowEdge, as: "edges" }
    ],
    order: [["name", "ASC"]]
  });
};

export const ShowFlowService = async (
  flowId: number | string,
  companyId: number
): Promise<Flow> => {
  const flow = await Flow.findOne({
    where: { id: flowId, companyId },
    include: [
      { model: FlowNode, as: "nodes" },
      { model: FlowEdge, as: "edges" }
    ]
  });
  if (!flow) throw new AppError("ERR_NO_FLOW_FOUND", 404);
  return flow;
};

interface NodeInput {
  nodeKey: string;
  type: string;
  title?: string;
  message?: string;
  config?: string | object;
  positionX?: number;
  positionY?: number;
}

interface EdgeInput {
  sourceNodeKey: string;
  targetNodeKey: string;
  condition?: string;
  label?: string;
}

interface UpsertData {
  name: string;
  description?: string;
  active?: boolean;
  queueId?: number | null;
  entryNodeKey?: string;
  nodes?: NodeInput[];
  edges?: EdgeInput[];
  companyId: number;
}

const normalizeConfig = (config?: string | object): string => {
  if (!config) return "{}";
  if (typeof config === "string") return config;
  return JSON.stringify(config);
};

export const CreateFlowService = async (data: UpsertData): Promise<Flow> => {
  const flow = await Flow.create({
    name: data.name,
    description: data.description || "",
    active: data.active !== false,
    queueId: data.queueId || null,
    entryNodeKey: data.entryNodeKey || null,
    companyId: data.companyId
  });

  if (data.nodes?.length) {
    await FlowNode.bulkCreate(
      data.nodes.map(n => ({
        flowId: flow.id,
        nodeKey: n.nodeKey,
        type: n.type as any,
        title: n.title || "",
        message: n.message || "",
        config: normalizeConfig(n.config),
        positionX: n.positionX || 0,
        positionY: n.positionY || 0
      }))
    );
  }

  if (data.edges?.length) {
    await FlowEdge.bulkCreate(
      data.edges.map(e => ({
        flowId: flow.id,
        sourceNodeKey: e.sourceNodeKey,
        targetNodeKey: e.targetNodeKey,
        condition: e.condition || null,
        label: e.label || null
      }))
    );
  }

  return ShowFlowService(flow.id, data.companyId);
};

export const UpdateFlowService = async (
  flowId: number | string,
  data: UpsertData
): Promise<Flow> => {
  const flow = await ShowFlowService(flowId, data.companyId);

  await flow.update({
    name: data.name ?? flow.name,
    description: data.description ?? flow.description,
    active: data.active ?? flow.active,
    queueId: data.queueId === undefined ? flow.queueId : data.queueId,
    entryNodeKey: data.entryNodeKey ?? flow.entryNodeKey
  });

  if (data.nodes) {
    await FlowNode.destroy({ where: { flowId: flow.id } });
    if (data.nodes.length) {
      await FlowNode.bulkCreate(
        data.nodes.map(n => ({
          flowId: flow.id,
          nodeKey: n.nodeKey,
          type: n.type as any,
          title: n.title || "",
          message: n.message || "",
          config: normalizeConfig(n.config),
          positionX: n.positionX || 0,
          positionY: n.positionY || 0
        }))
      );
    }
  }

  if (data.edges) {
    await FlowEdge.destroy({ where: { flowId: flow.id } });
    if (data.edges.length) {
      await FlowEdge.bulkCreate(
        data.edges.map(e => ({
          flowId: flow.id,
          sourceNodeKey: e.sourceNodeKey,
          targetNodeKey: e.targetNodeKey,
          condition: e.condition || null,
          label: e.label || null
        }))
      );
    }
  }

  return ShowFlowService(flow.id, data.companyId);
};

export const DeleteFlowService = async (
  flowId: number | string,
  companyId: number
): Promise<void> => {
  const flow = await ShowFlowService(flowId, companyId);
  await FlowEdge.destroy({ where: { flowId: flow.id } });
  await FlowNode.destroy({ where: { flowId: flow.id } });
  await flow.destroy();
};
