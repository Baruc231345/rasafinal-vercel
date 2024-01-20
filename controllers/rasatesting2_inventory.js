const db1 = require("../routes/rasa-db");

const rasatesting2_inventory = async (req, res) => {
  const {
    auditorium,
    foodandbeverage,
    multihall,
    dancestudio,
    gym,
    classroom,
    classroom_number,
    kitchen,
    mainlobby,
    inventory_id,
    sound_system,
    sound_system_quantity,
    microphone,
    microphone_quantity,
    lcd,
    lcd_quantity,
    widescreen,
    widescreen_quantity,
    chair,
    chair_quantity,
    table_input,
    table_quantity,
    other,
    other_quantity,
    blackpanel,
    blackpanel_quantity,
    whiteboard,
    whiteboard_quantity,
    aircon,
    start_aircon,
    end_aircon,
    sound_system_max,
    table_max,
    chairs_max,
    lcd_max,
    microphone_max,
    widescreen_max,
    blackpanel_max,
    whiteboard_max,
    date_changes,
  } = req.body;
  const formattedDate = new Date(date_changes).toISOString().split('T')[0];
  try {
    const results = await new Promise((resolve, reject) => {
      db1.query(
        'INSERT INTO inventory_table SET ?',
        {
          inventory_id: inventory_id,auditorium: auditorium,foodandbeverage: foodandbeverage,
          multihall: multihall,dancestudio: dancestudio,gym: gym,
          classroom: classroom,classroom_number: classroom_number,
          kitchen: kitchen, mainlobby: mainlobby,
          sound_system: sound_system,sound_system_quantity: sound_system_quantity,
          microphone: microphone,
          microphone_quantity: microphone_quantity, lcd: lcd,lcd_quantity: lcd_quantity,widescreen: widescreen,
          widescreen_quantity: widescreen_quantity, 
          chair: chair, chair_quantity: chair_quantity,
          table_input: table_input,table_quantity: table_quantity,other: other,
          other_quantity: other_quantity,blackpanel: blackpanel,
          blackpanel_quantity: blackpanel_quantity,whiteboard: whiteboard,whiteboard_quantity: whiteboard_quantity,
          aircon: aircon,start_aircon: start_aircon,end_aircon: end_aircon,sound_system_max: sound_system_max,table_max: table_max,chairs_max: chairs_max,lcd_max: lcd_max,microphone_max: microphone_max,widescreen_max: widescreen_max,blackpanel_max: blackpanel_max,whiteboard_max: whiteboard_max,date_changes: formattedDate
        },
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
    const insertedId = results.insertId;
    return res.json({
      status: "success",
      inventory_Id: insertedId,
      success: "Successfully Inputted",
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};
module.exports = rasatesting2_inventory;
