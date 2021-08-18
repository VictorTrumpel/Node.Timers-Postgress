exports.up = function (knex) {
  return knex.schema.createTable("sessions", function (table) {
    table.increments("userId");
    table.string("sessionId");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("sessions");
};
