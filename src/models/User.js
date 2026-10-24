// Users are read and written through UserRepository. This model is only left
// so Post and Comment can include their owner until they move to Knex too.
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
