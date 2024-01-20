const db1 = require("../routes/rasa-db");
const getInputtedData = (req, res) => {
  db1.query("SELECT * FROM inputted_table", (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    const inputtedData = results.map((row) => ({
      full_name: row.full_name,
      event_name: row.event_name,
      event_description: row.event_description,
      event_day: row.event_day,
      start_time: row.start_time,
      end_time: row.end_time,
    }));

    return res.json(inputtedData);
  });
};
module.exports = getInputtedData;