const db1 = require("../routes/rasa-db");

const rasatesting2 = async (req, res) => {
  const {
    full_name,
    people_id,
    event_name,
    event_description,
    event_day,
    start_time,
    end_time,
    user_id,
    contact_number,
    authenticated,
    requestor_information,
    requestor_type,
    participants,
    purpose_objectives,
    required_day,
    endorsed,
    auditorium,
    foodandbeverage,
    mainlobby,
    dancestudio,
    multihall,
    gym,
    kitchen,
    classroom,
  } = req.body;

  const venueArray = [
    [auditorium, "auditorium"],
    [foodandbeverage, "foodandbeverage"],
    [mainlobby, "mainlobby"],
    [dancestudio, "dancestudio"],
    [multihall, "multihall"],
    [gym, "gym"],
    [kitchen, "kitchen"],
    [classroom, "classroom"],
  ];

  const selectedArray = venueArray
    .filter(([value]) => value === 1)
    .map(([_, name]) => name);

  console.log("Selected venues:", selectedArray);

  const eventDate = new Date(event_day);
  const requiredDays = Number(required_day);
  eventDate.setDate(eventDate.getDate() + requiredDays - 1);
  const end_date = eventDate.toISOString().split("T")[0];

  try {   
    const duplicateResults = await new Promise((resolve, reject) => {
      db1.query(
        `SELECT * FROM inputted_table WHERE full_name = ? AND event_name = ? AND event_description = ? 
        AND event_day = ? AND start_time = ?`,
        [full_name, event_name, event_description, event_day, start_time],
        (error, results) => {
          if (error) {
            reject(error);
            console.error("Error on selecting:", error);
          } else {
            console.log("63" , full_name, event_name, event_description)
            resolve(results);
          }
        }
      );
    });
    
    if (duplicateResults.length > 0) {
      console.log("Duplicate Event. Please Try again:", duplicateResults);
      return res.status(400).json({
        status: "duplicated",
        error2: "Duplicate RASA.",
      });
    } else {
    const overlappingEvents = await new Promise((resolve, reject) => {
      const venueConditions = selectedArray.map((venue) => `${venue} = 1`).join(' OR ');

      db1.query(
        `SELECT * FROM calendar_input WHERE event_day = ? AND 
         ((CAST(? AS TIME) >= start_time AND CAST(? AS TIME) < end_time) OR 
          (CAST(? AS TIME) > start_time AND CAST(? AS TIME) <= end_time) OR 
          (CAST(? AS TIME) <= start_time AND CAST(? AS TIME) >= end_time)) AND 
         (${venueConditions})`,
        [event_day, start_time, start_time, end_time, end_time, start_time, end_time],
        (error, results) => {
          if (error) {
            reject(error);
            console.error("Error executing the query:", error);
          } else {
            console.log("Overlapping events in calendar_input:", results);

            if (results.length > 0) {
              console.log("Overlapping events found. Aborting insertion.");
              res.status(400).json({
                status: "aborted",
                error: "Overlapping event found in calendar_table. Please choose a different time.",
              });
              return;
            }

            db1.query(
              "INSERT INTO inputted_table SET ?",
              {
                full_name,
                people_id,
                user_id,
                event_name,
                event_description,
                event_day,
                start_time,
                end_date,
                end_time,
                contact_number,
                requestor_information,
                requestor_type,
                endorsed,
                participants,
                purpose_objectives,
                required_day,
                rasa_status: "Pending",
                authenticated,
                rasa_noteClassroom: 0,
                rasa_noteHRM: 0,
                rasa_note: 0,
                rasa_note2: 0,
                rasa_note3: 0,
                rasa_note_void: 0,
              },
              (error, results) => {
                if (error) {
                  console.error(error);
                  res.status(500).json({
                    status: "error",
                    error: "Error inserting data into inputted_table.",
                  });
                } else {
                  const insertedId = results.insertId;
                  console.log(insertedId + " rasatesting2.js line 70");
                  res.json({
                    status: "success",
                    id: insertedId,
                    success: "Rasatesting 2 is successfully done",
                  });
                }
              }
            );
          }
        }
      
      );
    });
  }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", error: "Internal server error." });
  }
};

module.exports = rasatesting2;