exports.up = knex =>
  knex.schema.createTable('users', table => {
    table.increments('id')
    table.string('username').notNullable().unique()
    table.string('email').notNullable().unique()
    table.string('password').notNullable()
    table.string('title')
    table.datetime('created_at').notNullable()
    table.datetime('updated_at').notNullable()
  })

exports.down = knex => knex.schema.dropTable('users')
