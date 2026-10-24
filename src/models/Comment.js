// Unused: every resource goes through a Knex repository now. Removed with the
// rest of src/models in the last step of #27.
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
