require("dotenv").config();

const express = require("express");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const pick = require("lodash/pick");
const { nanoid } = require("nanoid");
const app = express();

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

nunjucks.configure("views", {
  autoescape: true,
  express: app,
  tags: {
    blockStart: "[%",
    blockEnd: "%]",
    variableStart: "[[",
    variableEnd: "]]",
    commentStart: "[#",
    commentEnd: "#]",
  },
});

const port = process.env.PORT || 3000;

const findUserByUserName = async (username) => knex("users").select().where({ username });

const createSession = async (userId) => {
  const sessionId = nanoid();

  await knex("sessions").insert({ sessionId, userId });

  return sessionId;
};

const deleteSession = async (sessionId) => {
  await knex("sessions").where({ sessionId }).del();
};

const auth = () => async (req, res, next) => {
  const sessionId = req.cookies["sessionId"];

  if (!sessionId) {
    return next();
  }

  const [session] = await knex("sessions").select().where({ sessionId });

  req.user = await knex("users").select().where({ id: session.userId });
  req.sessionId = sessionId;
  next();
};

app.set("view engine", "njk");

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

app.get("/", auth(), async (req, res) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
    singUpError: req.query.singUpError === "true" ? req.query.message : req.query.singUpError,
  });
});

app.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = pick(req.body, "username", "password");
  const [user] = await findUserByUserName(username);

  if (!user || user.password !== password) {
    return res.redirect("/?authError=true");
  }

  const sessionId = await createSession(user.id);
  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

app.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }
  await deleteSession(req.sessionId);
  res.clearCookie("sessionId").redirect("/");
});

app.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  try {
    const { username, password } = pick(req.body, "username", "password");

    const users = await knex("users").select().where({ username });
    const isUsernameFree = users.length === 0;

    const errMessage = !isUsernameFree ? "Name is already taken" : !password ? "Password no enter" : "";
    if (!isUsernameFree || !password || !username) {
      res.redirect(`/?singUpError=true&message=${errMessage}`);
      return null;
    }

    await knex("users").insert({ username, password });

    res.redirect("/");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.get("/api/timers", async (req, res) => {
  const { isActive } = pick(req.query, "isActive");

  const timers = await knex("timers").select().where({ isActive });

  timers.map(async (timer) => {
    const timerId = timer.id;
    const progress = new Date() - new Date(timer.start);

    timer.progress = progress;

    await knex("timers").where({ id: timerId }).update({ progress, duration: progress, end: new Date() });

    return timer;
  });

  res.json(timers);
});

app.post("/api/timers/:id/stop", async (req) => {
  const timerId = req.originalUrl.split("/")[3];
  await knex("timers").where({ id: timerId }).update({ isActive: false });
});

app.post("/api/timers", async (req) => {
  await knex("timers").insert({
    start: new Date(),
    progress: 0,
    description: req.body.description,
    isActive: true,
  });
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
