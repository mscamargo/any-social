exports.up = knex =>
  knex.schema.createTable('comments', table => {
    table.increments('id')
    table.string('text', 140).notNullable()
    table
      .integer('post_id')
      .notNullable()
      .references('id')
      .inTable('posts')
      .onDelete('CASCADE')
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
    table.datetime('created_at').notNullable()
    table.datetime('updated_at').notNullable()
  })

exports.down = knex => knex.schema.dropTable('comments')
