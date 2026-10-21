const env = require('./env')

module.exports = {
  dialect: 'sqlite',
  storage: env.DB_STORAGE,
  operatorAliases: false,
  logging: env.IS_TEST ? false : console.log,
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true
  }
}
