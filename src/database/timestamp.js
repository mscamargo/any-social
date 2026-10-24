// Same format Sequelize writes to SQLite ('2019-07-19 15:25:39.000 +00:00'),
// so rows written by Knex still parse while Sequelize reads the same tables.
module.exports = (date = new Date()) =>
  date.toISOString().replace('T', ' ').replace('Z', ' +00:00')
