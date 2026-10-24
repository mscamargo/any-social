// Comments are read and written through CommentRepository. This model is only
// left so Post can include its comments until posts move to Knex too.
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
