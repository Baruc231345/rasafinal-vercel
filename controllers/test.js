const db1 = require("../routes/rasa-db");

function checkSufficient(id, callback) {
  db1.query(
    "SELECT event_day, start_time, end_time FROM inputted_table WHERE id = ?",
    [id],
    (error, result) => {
      if (error) {
        console.error("Error executing the query:", error);
        return callback(error, null);
      }

      const [row] = result;
      if (row) {
        const { event_day, start_time, end_time } = row;

        db1.query(
          "SELECT * FROM inventory_table WHERE inventory_id = ?",
          [id],
          (error, inventoryData) => {
            if (error) {
              console.error("Error executing the query:", error);
              return callback(error, null);
            }

            // Perform the second query to check for overlapping events
            db1.query(
              `SELECT * FROM calendar_input WHERE event_day = ? AND 
           ((CAST(? AS TIME) >= start_time AND CAST(? AS TIME) < end_time) OR 
            (CAST(? AS TIME) > start_time AND CAST(? AS TIME) <= end_time) OR 
            (CAST(? AS TIME) <= start_time AND CAST(? AS TIME) >= end_time))`,
              [
                event_day,
                start_time,
                start_time,
                end_time,
                end_time,
                start_time,
                end_time,
              ],
              (error, overlappingEvents) => {
                if (error) {
                  console.error("Error executing the query:", error);
                  return callback(error, null);
                }

                overlappingEvents = overlappingEvents;;

                console.log(
                  "Overlapping events in calendar_input:",overlappingEvents

                );
                console.log("Inventory data from user's inventory_table:", inventoryData[0].inventory_id, "Inventory ID \n",
                inventoryData[0].chair_quantity, "Chair Quantity / ", inventoryData[0].chairs_max , " Chair Max \n",
                inventoryData[0].table_quantity, "Table Quantity / ", inventoryData[0].table_max ,  " Table Max \n",
                inventoryData[0].sound_system_quantity, "Sound System Quantity / ", inventoryData[0].sound_system_max,  " Sound Sytem Max \n",
                inventoryData[0].microphone_quantity, "Microphone Quantity / ", inventoryData[0].microphone_max ,  " Microphone Max \n",
                inventoryData[0].lcd_quantity, "LCD Quantity / ", inventoryData[0].lcd_max ,  " LCD Max \n",
                inventoryData[0].widescreen_quantity, "Widescreen Quantity / ", inventoryData[0].widescreen_max ,  " Widescreen Max \n",
                inventoryData[0].blackpanel_quantity, "Blackpanel Quantity / ", inventoryData[0].blackpanel_max ,  " Blackpanel Max \n",
                inventoryData[0].whiteboard_quantity, "Whiteboard Quantity / ", inventoryData[0].whiteboard_max ,  " Whiteboard Max \n",
                );

                // Calculate the sum of chair_quantity from overlapping events
                const totalChairQuantity = overlappingEvents.reduce(
                  (total, event) => total + event.chair_quantity,0
                );

                const totalSoundSystemQuantity = overlappingEvents.reduce(
                  (total, event) => total + event.sound_system_quantity,0
                );

                const totalMicrophoneQuantity = overlappingEvents.reduce(
                  (total, event) => total + event.microphone_quantity,0
                );

                const totalLcdQuantity = overlappingEvents.reduce(
                  (total, event) => total + event.lcd_quantity,0
                );

                const totalWidescreenQuantity = overlappingEvents.reduce(
                  (total, event) => total + event.widescreen_quantity,0
                );

                const totalTableQuantity = overlappingEvents.reduce(
                  (total, event) => total + event.table_quantity,0
                );

                const totalBlackpanelQuantity = overlappingEvents.reduce(
                  (total, event) => total + event.blackpanel_quantity,0
                );

                const totalWhiteboardQuantity = overlappingEvents.reduce(
                  (total, event) => total + event.whiteboard_quantity,0
                );

                console.log("Total Accumulated Chair from Overlapped Event", totalChairQuantity);
                console.log("Total Accumulated Table from Overlapped Event", totalTableQuantity);
                console.log("Total Accumulated LCD from Overlapped Event", totalLcdQuantity);
                console.log("Total Accumulated Widescreen from Overlapped Event", totalWidescreenQuantity);
                console.log("Total Accumulated Sound System from Overlapped Event", totalSoundSystemQuantity);
                console.log("Total Accumulated Black Panel from Overlapped Event", totalBlackpanelQuantity);
                console.log("Total Accumulated Whiteboard from Overlapped Event", totalWhiteboardQuantity);

                // Calculate total available chairs
                const totalAvailable_Chair = inventoryData[0].chairs_max - totalChairQuantity ; //  1000 max chairs - 900 Accumulated Chairs
                const totalAvailable_Table = inventoryData[0].table_max - totalTableQuantity;
                const totalAvailable_Lcd = inventoryData[0].lcd_max - totalLcdQuantity;
                console.log(totalAvailable_Lcd , inventoryData[0].lcd_max , totalLcdQuantity)
                const totalAvailable_Widescreen = inventoryData[0].widescreen_max - totalWidescreenQuantity;
                const totalAvailable_SoundSystem = inventoryData[0].sound_system_max - totalSoundSystemQuantity;
                const totalAvailable_Blackpanel = inventoryData[0].blackpanel_max - totalBlackpanelQuantity;
                const totalAvailable_Whiteboard = inventoryData[0].whiteboard_max - totalWhiteboardQuantity;
                const totalAvailable_Microphone = inventoryData[0].microphone_max - totalMicrophoneQuantity;

                if (
                  totalAvailable_Chair <= inventoryData[0].chair_quantity ||
                  totalAvailable_Table <= inventoryData[0].table_quantity ||
                  totalAvailable_Lcd <= inventoryData[0].lcd_quantity ||
                  totalAvailable_Widescreen <= inventoryData[0].widescreen_quantity ||
                  totalAvailable_SoundSystem <= inventoryData[0].sound_system_quantity ||
                  totalAvailable_Blackpanel <=  inventoryData[0].blackpanel_quantity ||
                  totalAvailable_Whiteboard <=  inventoryData[0].whiteboard_quantity ||
                  totalAvailable_Microphone <=  inventoryData[0].microphone_quantity) 
                  {
                    return callback({
                      status: 400,
                      message: "Sufficient Equipment",
                    })
                  }

                callback(null, {
                  inputData: {
                    eventDay: event_day,
                    startTime: start_time,
                    endTime: end_time,
                  },
                  overlappingEvents: overlappingEvents,
                  inventoryData: inventoryData,
                  totalChairQuantity: totalChairQuantity,
                  totalAvailable_Chair: totalAvailable_Chair,
                  totalSoundSystemQuantity: totalSoundSystemQuantity,
                  totalAvailable_SoundSystem: totalAvailable_SoundSystem,
                  totalMicrophoneQuantity: totalMicrophoneQuantity,
                  totalAvailable_Microphone: totalMicrophoneQuantity,
                  totalLcdQuantity: totalLcdQuantity,
                  totalAvailable_Lcd: totalAvailable_Lcd,
                  totalWidescreenQuantity: totalWidescreenQuantity,
                  totalAvailable_Widescreen: totalAvailable_Widescreen,
                  totalTableQuantity: totalTableQuantity,
                  totalAvailable_Table: totalAvailable_Table,
                  totalBlackpanelQuantity: totalBlackpanelQuantity,
                  totalAvailable_Blackpanel: totalAvailable_Blackpanel,
                  totalWhiteboardQuantity: totalWhiteboardQuantity,
                  totalAvailable_Whiteboard: totalAvailable_Whiteboard,
                });
              }
            );
          }
        );
      } else {
        const noDataRowError = new Error("No data found for the specified ID.");
        console.error(noDataRowError.message);
        return callback(noDataRowError, null);
      }
    }
  );
}

// Call the function with an example ID
checkSufficient(499, (error, queryResult) => {
  if (error) {
    console.error("Insufficient Inventory", error);
    return;
  } else {
    console.log("process is verified, proceeding to process");
    // Process...
  }
});

