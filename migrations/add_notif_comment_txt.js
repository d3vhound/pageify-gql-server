module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'notifications', 
      'comment_text', 
      Sequelize.STRING
    )
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'notifications',
      'comment_text'
    );
  }
}