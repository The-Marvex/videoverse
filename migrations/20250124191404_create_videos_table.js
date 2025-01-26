exports.up = function (knex) {
    return knex.schema.createTable('videos', (table) => {
        table.increments('id').primary();
        table.text('filename').notNullable(); 
        table.text('file_path').notNullable(); 
        table.integer('size').notNullable(); 
        table.integer('duration').notNullable(); 
        table.timestamp('created_at').defaultTo(knex.fn.now()); 
        table.timestamp('updated_at').defaultTo(knex.fn.now()); 
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('videos');
};