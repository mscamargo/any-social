module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    text: DataTypes.STRING
  })

  Post.associate = models => {
    Post.belongsTo(models.User, { as: 'owner', foreignKey: 'userId' })
    Post.hasMany(models.Comment, { as: 'comments', foreignKey: 'postId' })
  }

  return Post
}
