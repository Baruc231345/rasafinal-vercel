const db1 = require("../routes/rasa-db");

const calendarInput = async (req, res) => {
  const { id, event_name, event_day, event_description, required_day, start_time, end_time, gym, 
    classroom, classroom_number, kitchen, mainlobby, 
    dancestudio, multihall, foodandbeverage, auditorium,
    chair_quantity, table_quantity, lcd_quantity, widescreen_quantity, blackpanel_quantity,
    whiteboard_quantity, sound_system_quantity } = req.body;

  console.log("calendarInput.js controller")
  console.log("id:" , id)
  console.log("event_name:" , event_name)
  console.log("event_day:" , event_day)
  console.log("event_description:" , event_description)
  console.log("required_day:" , required_day)
  console.log("id:" , id)


  try {
    for (let i = 1; i <= required_day; i++) {
      const newEventDay = new Date(event_day);
      newEventDay.setDate(newEventDay.getDate() + i);
      const formattedEventDay = newEventDay.toISOString().split("T")[0];
      console.log("formatted Day:", formattedEventDay);
    
      await new Promise((resolve, reject) => {
        db1.query(
          'INSERT INTO calendar_input SET ?',
          {
            id: id,
            event_name: event_name,
            event_day: formattedEventDay,
            event_description: event_description,
            required_day: required_day,
            start_time: start_time,
            end_time: end_time,
            chair_quantity: chair_quantity,
            table_quantity: table_quantity,
            lcd_quantity: lcd_quantity,
            widescreen_quantity: widescreen_quantity,
            blackpanel_quantity: blackpanel_quantity,
            whiteboard_quantity: whiteboard_quantity,
            sound_system_quantity: sound_system_quantity,
            gym: gym, 
            classroom: classroom, 
            classroom_number: classroom_number, 
            kitchen: kitchen, 
            mainlobby: mainlobby, 
            dancestudio: dancestudio, 
            multihall: multihall, 
            foodandbeverage: foodandbeverage, 
            auditorium: auditorium,
          },
          (error, results) => {
            if (error) {
              reject(error);
            } else {
              console.log("Success on calendar_input");
              resolve(results);
            }
          }
        );
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = calendarInput;