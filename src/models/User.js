// Unused: every resource goes through a Knex repository now. Removed with the
// rest of src/models in the last step of #27.
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    title: DataTypes.STRING
  }, {
    defaultScope: {
      attributes: { exclude: ['password'] }
    }
  })

  User.associate = models => {
    User.hasMany(models.Post, { as: 'posts', foreignKey: 'userId' })
  }

  return User
}
