const db1 = require("../routes/rasa-db");

const rasatesting2_inventory = async (req, res,) => {
  const { auditorium, foodandbeverage, multihall, dancestudio, 
    gym, classroom, classroom_number, kitchen, mainlobby, rasa_inventory_id, sound_system, 
    sound_system_quantity, microphone, microphone_quantity, lcd, lcd_quantity,
    widescreen, widescreen_quantity, chair, chair_quantity, table_input, table_quantity,
    other, other_quantity, blackpanel, blackpanel_quantity, whiteboard, whiteboard_quantity, aircon, 
    start_aircon, end_aircon} = req.body;

  const columnsWithQuantity = ['sound_system_quantity', 'microphone_quantity', 'lcd_quantity', 'widescreen_quantity', 'chair_quantity', 'table_quantity', 'other_quantity', 'blackpanel_quantity', 'whiteboard_quantity'];
  const dataToInsert = {};
  columnsWithQuantity.forEach((column) => {
    dataToInsert[column] = parseInt(req.body[column], 10) || 0;
  });

  const soundSystemValue = sound_system || 0;
  try {
    const results = await new Promise((resolve, reject) => {
      db1.query('INSERT INTO temporary_inventory_table SET ?', {
        rasa_inventory_id: rasa_inventory_id,
        auditorium: auditorium,
        foodandbeverage: foodandbeverage,
        multihall: multihall,
        dancestudio: dancestudio,
        gym: gym,
        classroom: classroom,
        classroom_number: classroom_number,
        kitchen: kitchen,
        mainlobby: mainlobby,
        sound_system: soundSystemValue,
        sound_system_quantity: sound_system_quantity,
        microphone: microphone,
        microphone_quantity: microphone_quantity,
        lcd: lcd,
        lcd_quantity: lcd_quantity,
        widescreen: widescreen,
        widescreen_quantity: widescreen_quantity, 
        chair: chair, 
        chair_quantity: chair_quantity,
        table_input: table_input,
        table_quantity: table_quantity,
        other: other,
        other_quantity: other_quantity,
        blackpanel: blackpanel,
        blackpanel_quantity: blackpanel_quantity,
        whiteboard: whiteboard,
        whiteboard_quantity: whiteboard_quantity,
        aircon: aircon,
        start_aircon: start_aircon,
        end_aircon: end_aircon,
      }, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    console.log(results + "TEMPORARY INVENTORY.js");
    const inventoryId = results.insertId; 
    console.log(inventoryId + "wtf is this?"); 
    return res.json({
      status: "success",
      inventoryId: inventoryId,
      success: "Date Already Successfully Inputted"
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};
module.exports = rasatesting2_inventory;