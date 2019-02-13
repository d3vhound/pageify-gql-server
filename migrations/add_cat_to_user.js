module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'users', 
      'category', 
      Sequelize.STRING
    )
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'notifications',
      'category'
    );
  }
}