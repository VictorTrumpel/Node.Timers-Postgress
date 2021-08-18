require("dotenv").config();

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
});

(async () => {
  try {
    const admin = await knex
      .select()
      .table("users")
      .where({ username: 2 })
      .then((data) => data[0]);
    console.log(admin);
  } catch (err) {
    console.error("вышла ошибка");
    console.error(err);
  }
})();
