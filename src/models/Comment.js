module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    text: DataTypes.STRING
  })

  Comment.associate = models => {
    Comment.belongsTo(models.Post, { as: 'post', foreignKey: 'postId' })
    Comment.belongsTo(models.User, { as: 'owner', foreignKey: 'userId' })
  }

  return Comment
}
