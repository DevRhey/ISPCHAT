import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Contacts", "remoteJid", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Contacts", "remoteJid");
  }
};
