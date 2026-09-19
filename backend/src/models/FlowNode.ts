import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType,
  Default,
  AllowNull
} from "sequelize-typescript";
import Flow from "./Flow";

export type FlowNodeType =
  | "start"
  | "message"
  | "menu"
  | "input"
  | "condition"
  | "http"
  | "isp_action"
  | "transfer"
  | "typebot"
  | "n8n"
  | "end";

@Table({ tableName: "FlowNodes" })
class FlowNode extends Model<FlowNode> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Flow)
  @Column
  flowId: number;

  @BelongsTo(() => Flow)
  flow: Flow;

  @AllowNull(false)
  @Column
  nodeKey: string;

  @AllowNull(false)
  @Column
  type: FlowNodeType;

  @Column
  title: string;

  @Column(DataType.TEXT)
  message: string;

  /** JSON: options, variable, url, method, headers, body, expression, action, queueId, integrationId, etc. */
  @Default("{}")
  @Column(DataType.TEXT)
  config: string;

  @Default(0)
  @Column
  positionX: number;

  @Default(0)
  @Column
  positionY: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  parseConfig(): Record<string, any> {
    try {
      return JSON.parse(this.config || "{}");
    } catch {
      return {};
    }
  }
}

export default FlowNode;
