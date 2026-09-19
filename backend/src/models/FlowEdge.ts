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
  AllowNull
} from "sequelize-typescript";
import Flow from "./Flow";

@Table({ tableName: "FlowEdges" })
class FlowEdge extends Model<FlowEdge> {
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
  sourceNodeKey: string;

  @AllowNull(false)
  @Column
  targetNodeKey: string;

  /** option value ("1"), "default", "true", "false", or expression label */
  @Column
  condition: string;

  @Column(DataType.TEXT)
  label: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default FlowEdge;
