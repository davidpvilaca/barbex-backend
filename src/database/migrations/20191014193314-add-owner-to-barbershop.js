module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('barbershops', 'owner', {
      type: Sequelize.INTEGER,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      allowNull: false,
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('barbershops', 'owner');
  },
};
