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
import Company from "./Company";

@Table({ tableName: "IspConnectors" })
class IspConnector extends Model<IspConnector> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  name: string;

  /** ixc | sgp | hubsoft | generic */
  @AllowNull(false)
  @Default("generic")
  @Column
  provider: string;

  @Column
  baseUrl: string;

  @Column(DataType.TEXT)
  token: string;

  @Default("{}")
  @Column(DataType.TEXT)
  config: string;

  @Default(true)
  @Column
  active: boolean;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

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

export default IspConnector;
