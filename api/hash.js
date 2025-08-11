const bcrypt = require("bcrypt");
const hashed = bcrypt.hashSync("123", 10);
console.log("Hashed admin password:", hashed);
