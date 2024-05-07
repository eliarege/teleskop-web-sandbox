export function up(knex) {
  return knex.schema.createTable('RECIPE_MASTER', function(table) {
      table.increments('recipe_id').notNullable();
      table.text('recipe_name').collate('default');
      table.integer('recipe_group');
      table.text('recipe_comment').collate('default');
      table.integer('recipe_type');
      table.timestamp('prep_time', { precision: 6, useTz: true });
      table.timestamp('last_update', { precision: 6, useTz: true });
      table.integer('step_no');
      table.integer('program_no');
      table.integer('machine_id');
      table.boolean('is_passive');

      // Primary key constraint
      table.primary('recipe_id');

      // Foreign key constraint
      table.foreign('machine_id').references('MACHINE.machine_id').onDelete('NO ACTION').onUpdate('NO ACTION');
  })
}

export function down(knex) {
  return knex.schema.dropTableIfExists('RECIPE_MASTER');
}
