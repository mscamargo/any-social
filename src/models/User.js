const bcrypt = require('bcryptjs')

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'Username is already in use'
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'E-mail is already in use'
      }
    },
    password: DataTypes.STRING,
    title: DataTypes.STRING
  }, {
    defaultScope: {
      attributes: { exclude: ['password'] }
    },
    scopes: {
      withPassword: {}
    }
  })

  User.addHook('beforeSave', async user => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 10)
    }
  })

  User.associate = models => {
    User.hasMany(models.Post, { as: 'posts' })
  }

  User.prototype.comparePasswordHash = async function (password) {
    return bcrypt.compare(password, this.password)
  }

  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get())

    delete values.password

    return values
  }

  return User
}
