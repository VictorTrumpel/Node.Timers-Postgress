exports.up = function (knex) {
  return knex.schema.createTable("timers", function (table) {
    table.increments("id");
    table.string("description");
    table.boolean("isActive");
    table.string("start");
    table.string("end");
    table.string("duration");
    table.string("progress");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("timers");
};
