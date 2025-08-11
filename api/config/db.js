const mysql  = require("mysql")
const db  = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    port: 3306,
    database:"dntn"
}) 
db.connect( err => {
    if (err) throw err; 
    console.log('Da ket noi database !')
});
module.exports = db
