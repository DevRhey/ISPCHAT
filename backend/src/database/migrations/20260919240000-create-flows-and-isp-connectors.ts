import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("Flows", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      queueId: {
        type: DataTypes.INTEGER,
        references: { model: "Queues", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      entryNodeKey: {
        type: DataTypes.STRING,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable("FlowNodes", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      flowId: {
        type: DataTypes.INTEGER,
        references: { model: "Flows", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      nodeKey: {
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      config: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      positionX: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      positionY: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex("FlowNodes", ["flowId", "nodeKey"], {
      unique: true,
      name: "flow_nodes_flow_key_unique"
    });

    await queryInterface.createTable("FlowEdges", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      flowId: {
        type: DataTypes.INTEGER,
        references: { model: "Flows", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      sourceNodeKey: {
        type: DataTypes.STRING,
        allowNull: false
      },
      targetNodeKey: {
        type: DataTypes.STRING,
        allowNull: false
      },
      condition: {
        type: DataTypes.STRING,
        allowNull: true
      },
      label: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable("IspConnectors", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "generic"
      },
      baseUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      config: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    await queryInterface.addColumn("Tickets", "flowId", {
      type: DataTypes.INTEGER,
      references: { model: "Flows", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true
    });

    await queryInterface.addColumn("Tickets", "flowNodeKey", {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn("Tickets", "flowVariables", {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn("Queues", "flowId", {
      type: DataTypes.INTEGER,
      references: { model: "Flows", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Queues", "flowId");
    await queryInterface.removeColumn("Tickets", "flowVariables");
    await queryInterface.removeColumn("Tickets", "flowNodeKey");
    await queryInterface.removeColumn("Tickets", "flowId");
    await queryInterface.dropTable("IspConnectors");
    await queryInterface.dropTable("FlowEdges");
    await queryInterface.dropTable("FlowNodes");
    await queryInterface.dropTable("Flows");
  }
};
