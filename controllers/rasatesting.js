const db1 = require("../routes/rasa-db");

const rasatesting = async (req, res) => {
  const {
    full_name,
    event_name,
    event_description,
    event_day,
    start_time,
    required_day,
    requestor_information,
    requestor_type,
    end_time,
    contact_number,
    participants,
    purpose_objectives,
    endorsed,
    user_id,
    course,
  } = req.body;

  const eventDate = new Date(event_day);
  eventDate.setDate(eventDate.getDate() + Number(required_day));
  const end_date = eventDate.toISOString().split("T")[0];

  db1.query(
    'INSERT INTO temporary_inputted_table SET ?',
    {full_name: full_name,user_id: user_id,event_name: event_name,
      event_description: event_description,
      event_day: event_day,start_time: start_time,end_time: 
      end_time,course: course, end_date: end_date, requestor_information: requestor_information,requestor_type: 
      requestor_type,endorsed: endorsed,required_day: required_day,contact_number: contact_number,
      purpose_objectives: purpose_objectives,participants: participants,rasa_status: "Pending",
    },
    (error, results) => {
      if (error) {
        console.error(error);
      } else {
        const insertedId = results.insertId; 
        console.log(insertedId);
        return res.json({
          status: "success",
          id: insertedId,
          success: "Date Already Successfully Inputted",
        });
      }
    }
  );
};
module.exports = rasatesting;