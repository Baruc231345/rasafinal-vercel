const db1 = require("../routes/rasa-db");
const rasa_note = async (req, res) => {
  const { note, number, id } = req.body;

  console.log("----------------------");
  console.log("rasa_note.js controller");
  console.log("Received data:", note, number, id);

  let number1 = parseInt(number, 10);
  var noteForm = [
    [30,'rasa_noteClassroom'],
    [31,'rasa_noteClassroom'],
    [21,'rasa_noteHRM'],
    [1, "rasa_note"],
    [2, "rasa_note2"],
    [3, "rasa_note3"],
    [4, "rasa_note4"],
    [5, "rasa_note5"],
    [200,"rasa_note_void"],
  ];

  let finalNote;
  const x = noteForm.find(item => item[0] === number1);

  if (x) {
    console.log("Final Note:", x[1]);
    finalNote = x[1];
  } else {
    console.log("Note not Found");
    res.status(400).json({ status: 'error', error: 'Note not found for the given number.' });
    return; 
  }

  try {
    const query = `UPDATE inputted_table SET ${finalNote} = ? WHERE id = ?`;
    const values = [note, id];

    db1.query(query, values, (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).json({ status: 'error', error: `Error updating ${finalNote} in inputted_table.` });
      } else {
        console.log("Update successful:", results);
        res.json({
          status: 'success',
          message: 'Rasa note updated successfully.',
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', error: 'Internal server error.' });
  }
};

module.exports = rasa_note;