import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Companies", "activationState", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "active"
    });
    await queryInterface.addColumn("Companies", "operationEnabled", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
    await queryInterface.addColumn("Companies", "trialDays", {
      type: DataTypes.INTEGER,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Companies", "trialDays");
    await queryInterface.removeColumn("Companies", "operationEnabled");
    await queryInterface.removeColumn("Companies", "activationState");
  }
};
