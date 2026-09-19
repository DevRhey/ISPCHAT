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
  HasMany,
  DataType,
  Default,
  AllowNull
} from "sequelize-typescript";
import Company from "./Company";
import Queue from "./Queue";
import FlowNode from "./FlowNode";
import FlowEdge from "./FlowEdge";

@Table({ tableName: "Flows" })
class Flow extends Model<Flow> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  name: string;

  @Column(DataType.TEXT)
  description: string;

  @Default(true)
  @Column
  active: boolean;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => Queue)
  @Column
  queueId: number;

  @BelongsTo(() => Queue)
  queue: Queue;

  @Column
  entryNodeKey: string;

  @HasMany(() => FlowNode)
  nodes: FlowNode[];

  @HasMany(() => FlowEdge)
  edges: FlowEdge[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Flow;
