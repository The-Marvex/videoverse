exports.up = function (knex) {
    return knex.schema.createTable('video_links', (table) => {
        table.uuid('id').primary(); 
        table.integer('video_id').unsigned().notNullable();
        table.text('token').notNullable().unique(); 
        table.timestamp('expires_at').notNullable(); 
        table.timestamp('created_at').defaultTo(knex.fn.now()); 
        table.foreign('video_id').references('id').inTable('videos').onDelete('CASCADE');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('video_links');
};