'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */

    await queryInterface.changeColumn('bank_atms', 'address', {
      type: Sequelize.STRING,
      unique: true,
    });

    return queryInterface.changeColumn('boba_outlets', 'address', {
      type: Sequelize.STRING,
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */

    await queryInterface.changeColumn('bank_atms', 'address', {
      type: Sequelize.STRING,
      unique: false,
    });

    return queryInterface.changeColumn('boba_outlets', 'address', {
      type: Sequelize.STRING,
      unique: false,
    });
  },
};
