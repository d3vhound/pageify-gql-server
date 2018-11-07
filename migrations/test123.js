module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'users',
      'avatar'
    )
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'avatar')
  }
}