const db1 = require("../routes/rasa-db");

const rasa_authenticate = async (req, res) => {
  const { digit, id } = req.body;

  console.log("----------------------");
  console.log("rasa_authenticate.js controller");
  console.log("Received data:", digit, id);
  let digit1 = parseInt(digit, 10);

  var digits = [
    [2, 2],
    [404, 3],
  ];

  const y = digits.find(item => item[0] === digit1);
  let finalDigit;
  if (y) {
    console.log("Final Email:", y[1]);
    finalDigit = y[1];
  } else {
    console.log("Email not found");
  }
  console.log("Final Digit", finalDigit);

  try {
    const query = `UPDATE inputted_table SET authenticated = ? WHERE id = ?`;
    db1.query(query, [finalDigit, id], async (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).json({ status: 'error', error: `Error updating authenticated column in inputted_table.` });
      } else {
        console.log("Update successful:", results);
        res.json({
          status: 'success',
          message: 'Rasa Authenticate updated successfully.',
        });

        if (finalDigit === 3) {
          try {
            const query = `UPDATE inputted_table SET rasa_status = ? WHERE id = ?`;
            db1.query(query, ["Rasa Status is Voided", id]);
            console.log('Rasa Status updated to "This is voided".');
          } catch (error) {
            console.error('Error updating rasa_status:', error);
          }
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', error: 'Internal server error.' });
  }
}

module.exports = rasa_authenticate;