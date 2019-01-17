module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'comments', 
      'reply_to', 
      Sequelize.STRING
    )
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'comments',
      'reply_to'
    );
  }
}