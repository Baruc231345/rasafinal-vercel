const sql = require("mysql2");
const dotenv = require("dotenv").config();
const db1 = sql.createConnection({
    host: process.env.DATABASE_HOST1,
    user: process.env.DATABASE_USER1,
    password: process.env.DATABASE_PASSWORD1,
    database: process.env.DATABASE1,
    connectTimeout: 20000,
})
/*
const db1 = sql.createConnection({
    host: process.env.DATABASE_HOST1,
    user: process.env.DATABASE_USER1,
    password: process.env.DATABASE_PASSWORD1
})
db1.query(`SHOW DATABASES LIKE '${process.env.DATABASE1}';`, (error, result) => 
{
    if (error || result.length == 0)
    {
        db1.query(`CREATE DATABASE ${process.env.DATABASE1}`, (error, result) => {
            db1.changeUser({database: process.env.DATABASE1}, (error) => {
                createTablesIfNotExist();
            });
        });
    }
    else
    {
        db1.changeUser({database: process.env.DATABASE1}, (error) => {
            createTablesIfNotExist();
        });
    }
});

function createTablesIfNotExist()
{
    db1.query("SELECT * FROM archieved_inputted_table2", (error, result) => {
        if (error)
        {
            db1.query("CREATE TABLE archieved_inputted_table2(rasa_id int(11) NOT NULL, full_name varchar(255) NOT NULL, event_day date NOT NULL, event_name varchar(255) NOT NULL, event_description varchar(255) NOT NULL, start_time time NOT NULL, end_time time NOT NULL, rasa_status varchar(255) NOT NULL);");
        }
    });
}
*/
module.exports = db1;