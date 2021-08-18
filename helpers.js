const crypto = require("crypto");

const hash = (password) => crypto.createHash("sha256").update(password).digest("hex");

module.exports = hash;
