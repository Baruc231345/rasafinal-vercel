const express = require("express");
const app = express();
const PORT = process.env.PORT;
const PORT1 = process.env.PORT1;
const ACCOUNT_USER = process.env.ACCOUNT_USER;
const ACCOUNT_PASSWORD = process.env.ACCOUNT_PASSWORD;
const loggedIn = require("../controllers/loggedin");
const login = require("../controllers/login");
const logout = require("../controllers/logout");
const newreg = require("../controllers/newreg");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
app.use(cors());
const router = express.Router();
const multer = require("multer");
const db1 = require("../routes/rasa-db");
const { default: puppeteer } = require("puppeteer");
let universalId = null;
const storage = multer.memoryStorage();
router.use(express.static(__dirname + "/public"));
require("dotenv").config();
app.use(express.urlencoded({ extended: true }));
const nodemailer = require("nodemailer");
const { hash } = require("bcryptjs");
console.log(__dirname);

const crypto = require("crypto");
const encryptionKey = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
function encryptId(id) {
  const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);
  let encryptedId = cipher.update(id.toString(), "utf8", "hex");
  encryptedId += cipher.final("hex");
  return encryptedId;
}
function decryptId(encryptedId) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", encryptionKey, iv);
  let decryptedId = decipher.update(encryptedId, "hex", "utf8");
  decryptedId += decipher.final("utf8");
  return decryptedId;
}

router.get("/", loggedIn, (req, res, next) => {
  if (req.user) {
    const status = "loggedIn";
    res.render("index", { status: status, user: req.user });
    console.log(status);
  } else {
    const status = "Status is not logged in. Log in first";
    res.render("index", { status: status, user: "nothing" });
    console.log(status);
  }
});

// Middleware to restrict access to /dashboard if not logged in
const dashboardAccessMiddleware = (req, res, next) => {
  if (req.user) {
    return next();
  } else {
    res.redirect("/");
  }
};

const adminMiddleware = (req, res, next) => {
  const userId = req.user.id;
  db1.query("SELECT * FROM user WHERE id = ?", [userId], (err, results) => {
    if (err) throw err;

    const user = results[0];
    if (user.role === "admin") {
      return next();
    } else {
      console.log("You're not Admin!");
      res.clearCookie("userRegistered");
      res.redirect("/dashboardRegular");
    }
  });
};

router.get(
  "/dashboardAdmin",
  /*loggedIn, adminMiddleware */ (req, res) => {
    const universalId = req.session.universalId; // Retrieve the universalId from the session
    if (!universalId) {
      return res.status(400).send("Universal ID not found in the session");
    }
    res.sendFile("dashboard_admin.html", { root: "./public/" });
    console.log(universalId + " route /dashboardAdmin");
  }
);

router.get(
  "/dashboardRegular/:id",
  loggedIn,
  dashboardAccessMiddleware,
  (req, res) => {
    const id = req.params.id;
    req.session.universalId = id;
    res.render("dashboard_regular", { id });
    console.log(id + " route /dashboardRegular/:id");
  }
);

const checkUniversalCodeMiddleware = (req, res, next) => {
  const universalCode = req.session.universalId;
  console.log("----------------------------------------");
  console.log("checkUniversalCodeMiddleware middleware");
  console.log(universalCode);
  console.log("test");

  if (!universalCode) {
    req.session.universalId = null;
    return res.redirect("/");
  }

  next();
};

router.get("/ejsrasa/:id", (req, res) => {
  const rasaID = req.params.id;
  const universalId = req.session.universalId;
  console.log(rasaID);
  const query = "SELECT * FROM inputted_table WHERE id = ?";
  db1.query(query, [rasaID], function (error, data) {
    if (error) {
      throw error;
    } else {
      if (data.length > 0) {
        const inputted_table = data[0];
        res.locals.rasaID = rasaID;
        res.render("submitrasa", {
          inputted_table: inputted_table,
          universalId,
        });
      } else {
        res.status(404).send("Rasa not found");
      }
    }
  });
});

function checkInventory(id, callback) {
  const query1 = "SELECT * FROM inputted_table WHERE id = ?";
  const query2 = "SELECT * FROM inventory_table WHERE inventory_id = ?";
  const query3 = `SELECT * FROM calendar_input WHERE event_day = ? AND 
    ((CAST(? AS TIME) >= start_time AND CAST(? AS TIME) < end_time) OR 
    (CAST(? AS TIME) > start_time AND CAST(? AS TIME) <= end_time) OR 
    (CAST(? AS TIME) <= start_time AND CAST(? AS TIME) >= end_time))
  `;

  db1.query(query1, [id], (error, data1) => {
    if (error) {
      return callback(error, null);
    } else {
      if (data1.length > 0) {
        const { event_day, start_time, end_time } = data1[0];
        db1.query(
          query3,
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
              return callback(error, null);
            }

            const totalChairQuantity = overlappingEvents.reduce(
              (total, event) => total + event.chair_quantity,
              0
            );

            const totalSoundSystemQuantity = overlappingEvents.reduce(
              (total, event) => total + event.sound_system_quantity,
              0
            );

            const totalMicrophoneQuantity = overlappingEvents.reduce(
              (total, event) => total + event.microphone_quantity,
              0
            );

            const totalLcdQuantity = overlappingEvents.reduce(
              (total, event) => total + event.lcd_quantity,
              0
            );

            const totalWidescreenQuantity = overlappingEvents.reduce(
              (total, event) => total + event.widescreen_quantity,
              0
            );

            const totalTableQuantity = overlappingEvents.reduce(
              (total, event) => total + event.table_quantity,
              0
            );

            const totalBlackpanelQuantity = overlappingEvents.reduce(
              (total, event) => total + event.blackpanel_quantity,
              0
            );

            const totalWhiteboardQuantity = overlappingEvents.reduce(
              (total, event) => total + event.whiteboard_quantity,
              0
            );

            db1.query(query2, [id], (error, data2) => {
              if (error) {
                return callback(error, null);
              }

              if (data2.length > 0) {
                const totalAvailable_Chair =
                  data2[0].chairs_max - totalChairQuantity;
                const totalAvailable_Table =
                  data2[0].table_max - totalTableQuantity;
                const totalAvailable_Lcd = data2[0].lcd_max - totalLcdQuantity;
                const totalAvailable_Widescreen =
                  data2[0].widescreen_max - totalWidescreenQuantity;
                const totalAvailable_SoundSystem =
                  data2[0].sound_system_max - totalSoundSystemQuantity;
                const totalAvailable_Blackpanel =
                  data2[0].blackpanel_max - totalBlackpanelQuantity;
                const totalAvailable_Whiteboard =
                  data2[0].whiteboard_max - totalWhiteboardQuantity;
                const totalAvailable_Microphone =
                  data2[0].microphone_max - totalMicrophoneQuantity;

                // Data retrieval successful, create result object
                const result = {
                  data1: data1[0],
                  data2: data2[0],
                  totalAvailable_Chair,
                  totalAvailable_Table,
                  totalAvailable_Lcd,
                  totalAvailable_Widescreen,
                  totalAvailable_SoundSystem,
                  totalAvailable_Blackpanel,
                  totalAvailable_Whiteboard,
                  totalAvailable_Microphone,
                  // Add other properties as needed...
                };

                callback(null, result);
              } else {
                callback("Data from second table not found", null);
              }
            });
          }
        );
      } else {
        callback("Data from first table not found", null);
      }
    }
  });
}

// ejsrasavanilla1
router.get("/ejsrasaVanilla/:id", (req, res) => {
  const id = req.params.id;
  const universalId = req.session.universalId;

  checkInventory(id, (error, result) => {
    if (error) {
      console.error("Error retrieving inventory data:", error);
      res.status(500).send("Internal Server Error");
    } else {
      const {
        data1,
        data2,
        totalAvailable_Chair,
        totalAvailable_Table,
        totalAvailable_Lcd,
        totalAvailable_Widescreen,
        totalAvailable_SoundSystem,
        totalAvailable_Blackpanel,
        totalAvailable_Whiteboard,
        totalAvailable_Microphone,
      } = result;

      res.locals.id = id;
      res.render("submitrasaCopy", {
        id,
        datainputted: data1,
        datainventory: data2,
        universalId,
        totalAvailable_Chair,
        totalAvailable_Chair,
        totalAvailable_Table,
        totalAvailable_Lcd,
        totalAvailable_Widescreen,
        totalAvailable_SoundSystem,
        totalAvailable_Blackpanel,
        totalAvailable_Whiteboard,
        totalAvailable_Microphone,
      });
    }
  });
});

router.get("/ejsrasaCalendar/:id", (req, res) => {
  const id = req.params.id;
  const universalId = req.session.universalId;

  checkInventory(id, (error, result) => {
    if (error) {
      console.error("Error retrieving inventory data:", error);
      res.status(500).send("Internal Server Error");
    } else {
      // Destructure the result object to get individual properties
      const {
        data1,
        data2,
        totalAvailable_Chair,
        totalAvailable_Table,
        totalAvailable_Lcd,
        totalAvailable_Widescreen,
        totalAvailable_SoundSystem,
        totalAvailable_Blackpanel,
        totalAvailable_Whiteboard,
        totalAvailable_Microphone,
      } = result;

      res.locals.id = id;
      res.render("submitrasaCalendar", {
        id,
        datainputted: data1,
        datainventory: data2,
        universalId,
        totalAvailable_Chair,
        totalAvailable_Chair,
        totalAvailable_Table,
        totalAvailable_Lcd,
        totalAvailable_Widescreen,
        totalAvailable_SoundSystem,
        totalAvailable_Blackpanel,
        totalAvailable_Whiteboard,
        totalAvailable_Microphone,
      });
    }
  });
});

/*
router.get("/ejsrasaVanilla2/:encryptedId", (req, res) => {
  const rasaID = req.params.encryptedId;
  const universalId = req.session.universalId;
  const hashedId = rasaID;


  console.log("A");
  console.log("hashedId =" + hashedId);
  console.log("original id from parameters = "  );

  const query1 = "SELECT * FROM inputted_table WHERE id = ?";
  const query2 = "SELECT * FROM inventory_table WHERE inventory_id = ?";

  db1.query(query1, [rasaID], (error, data1) => {
    if (error) {
      throw error;
    } else {
      if (data1.length > 0) {
        db1.query(query2, [rasaID], (error, data2) => {
          if (error) {
            console.error("Error fetching data from inventory_table:", error); // Log the error
            throw error;
          } else {
            if (data2.length > 0) {
              const datainputted = data1[0];
              const datainventory = data2[0];
              res.locals.rasaID = rasaID;
              res.render("submitrasaCopy", {
                rasaID: rasaID,
                datainputted,
                datainventory,
                universalId,
              });
            } else {
              res.status(404).send("Data from second table not found");
            }
          }
        });
      } else {
        res.status(404).send("Data from the first table not found");
      }
    }
  });
});
*/

router.get("/ejsrasaVanilla2/:encryptedId", (req, res) => {
    const encryptedId = req.params.encryptedId;
    const id = decryptId(encryptedId)
    const universalId = req.session.universalId;
    const query1 = "SELECT * FROM inputted_table WHERE id = ?";
    const query2 = "SELECT * FROM inventory_table WHERE inventory_id = ?";
    const query3 = `SELECT * FROM calendar_input WHERE event_day = ? AND 
      ((CAST(? AS TIME) >= start_time AND CAST(? AS TIME) < end_time) OR 
      (CAST(? AS TIME) > start_time AND CAST(? AS TIME) <= end_time) OR 
      (CAST(? AS TIME) <= start_time AND CAST(? AS TIME) >= end_time))
    `;
  
    db1.query(query1, [id], (error, data1) => {
      if (error) {
        throw error;
      } else {
        if (data1.length > 0) {
          const { event_day, start_time, end_time } = data1[0];
          db1.query(
            query3,
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
                console.error(
                  "Error fetching data from calendar_input:",
                  error
                );
                throw error;
              }
              
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
  
                db1.query(query2, [id], (error, data2) => {
                  if (error) {
                    console.error(
                      "Error fetching data from inventory_table:",
                      error
                    );
                    throw error;
                  }
  
                  if (data2.length > 0) {
                    const totalAvailable_Chair = data2[0].chairs_max - totalChairQuantity ;
                    console.log(totalChairQuantity, "totalChairQuantity")
                    console.log(data2[0].chairs_max , "data2[0].chairs_max") 
                    console.log(totalAvailable_Chair , "total Available Chair")
                    const totalAvailable_Table = data2[0].table_max - totalTableQuantity;
                    const totalAvailable_Lcd = data2[0].lcd_max - totalLcdQuantity;
                    const totalAvailable_Widescreen = data2[0].widescreen_max - totalWidescreenQuantity;
                    const totalAvailable_SoundSystem = data2[0].sound_system_max - totalSoundSystemQuantity;
                    const totalAvailable_Blackpanel = data2[0].blackpanel_max - totalBlackpanelQuantity;
                    const totalAvailable_Whiteboard = data2[0].whiteboard_max - totalWhiteboardQuantity;
                    const totalAvailable_Microphone = data2[0].microphone_max - totalMicrophoneQuantity;
  
                    // Data retrieval successful, render the template
                    const datainputted = data1[0];
                    const datainventory = data2[0];
                    res.locals.id = id;
                    res.render("submitrasaCopy", {
                      id,
                      datainputted,
                      datainventory,
                      universalId,
                      totalAvailable_Chair,
                      totalAvailable_Table,
                      totalAvailable_Lcd,
                      totalAvailable_Widescreen,
                      totalAvailable_SoundSystem,
                      totalAvailable_Blackpanel,
                      totalAvailable_Whiteboard,
                      totalAvailable_Microphone,
                    });
                } else {
                  res.status(404).send("Data from second table not found");
                }
              });
            }
          );
        } else {
          res.status(404).send("Data from first table not found");
        }
      }
    });
  });

function fetchMaxValues(callback) {
  const maxValues = `
    SELECT * FROM inventory_max ORDER BY id DESC LIMIT 1;`;

  db1.query(maxValues, (error, results) => {
    if (error) {
      callback(error, null);
      return;
    }
    // Assuming there is only one row in the result set
    const maxValues = results.length > 0 ? results[0] : null;
    callback(null, maxValues);
  });
}

function getEvents(event_day, start_time, end_time, callback) {
  fetchMaxValues((error, maxValues) => {
    if (error) {
      callback(error, null);
      return;
    }
        const {
          chairs_max,
          table_max,
          sound_system_max,
          microphone_max,
          lcd_max,
          widescreen_max,
          blackpanel_max,
          whiteboard_max,
          date_changes
        } = maxValues;
    
        // Set global variables with max values
        maxChairs = chairs_max;
        maxTable = table_max;
        maxSoundSystem = sound_system_max;
        maxMicrophone = microphone_max;
        maxLcd = lcd_max;
        maxWidescreen = widescreen_max;
        maxBlackpanel = blackpanel_max;
        maxWhiteboard = whiteboard_max;
        //date_changes = date_changes;


  const query = `
    SELECT *, 
      SUM(table_quantity) as totalTables, 
      SUM(chair_quantity) as totalChairs,
      SUM(sound_system_quantity) as totalSoundSystem,
      SUM(microphone_quantity) as totalMicrophone, 
      SUM(lcd_quantity) as totalLcd, 
      SUM(widescreen_quantity) as totalWidescreen,
      SUM(blackpanel_quantity) as totalBlackpanel,
      SUM(whiteboard_quantity) as totalWhiteboard

    FROM calendar_input 
    WHERE event_day = ? AND 
    (
      (CAST(? AS TIME) >= start_time AND CAST(? AS TIME) < end_time) OR 
      (CAST(? AS TIME) > start_time AND CAST(? AS TIME) <= end_time) OR 
      (CAST(? AS TIME) <= start_time AND CAST(? AS TIME) >= end_time)
    )
  `;

  db1.query(
    query,
    [
      event_day,
      start_time,
      start_time,
      end_time,
      end_time,
      start_time,
      end_time,
    ],
    (error, results) => {
      if (error) {
        callback(error, null);
        return;
      }

      const totalTables =
        results.length > 0 ? results[0].totalTables : maxTable;
      const totalChairs =
        results.length > 0 ? results[0].totalChairs : maxChairs;
      const totalSoundSystem =
        results.length > 0 ? results[0].totalSoundSystem : maxSoundSystem;
      const totalMicrophone =
        results.length > 0 ? results[0].totalMicrophone : maxMicrophone;
      const totalLcd = results.length > 0 ? results[0].totalLcd : maxLcd;
      const totalWidescreen =
        results.length > 0 ? results[0].totalWidescreen : maxWidescreen;
      const totalBlackpanel =
        results.length > 0 ? results[0].totalBlackpanel : maxBlackpanel;
      const totalWhiteboard =
        results.length > 0 ? results[0].totalWhiteboard : maxWhiteboard;

      const availableTables = maxTable - totalTables; // total of tables - 900 max table
      const availableChairs = maxChairs - totalChairs; // totalchairs - 900 max table
      const availableSoundsystem = maxSoundSystem - totalSoundSystem;
      const availableMicrophone = maxMicrophone - totalMicrophone;
      const availableLcd = maxLcd - totalLcd;
      const availableWidescreen = maxWidescreen - totalWidescreen;
      const availableBlackpanel = maxBlackpanel - totalBlackpanel;
      const availableWhiteboard = maxWhiteboard - totalWhiteboard;

      callback(null, {
        results,
        availableTables,
        availableChairs,
        availableSoundsystem,
        availableMicrophone,
        availableLcd,
        availableWidescreen,
        availableBlackpanel,
        availableWhiteboard,
        date_changes,
      });
    }
  );
});
}

router.get("/ejsrasa_copy/:id/:id2", (req, res) => {
  const rasaID = req.params.id;
  const universalId = req.session.universalId;
 
  if (universalId == null || universalId === "") {
    // logout
    return res.redirect("/logout");
  }

  const query1 = 
    "SELECT * FROM temporary_inputted_table WHERE id = ?";
  const query2 =
    "SELECT * FROM temporary_inventory_table WHERE rasa_inventory_id = ?";
  const query3 =
    "SELECT event_day, start_time, end_time FROM temporary_inputted_table WHERE id = ?";

  db1.query(query1, [rasaID], (error, data1) => {
    if (error) {
      throw error;
    } else {
      if (data1.length > 0) {
        db1.query(query2, [rasaID], (error, data2) => {
          if (error) {
            throw error;
          } else {
            if (data2.length > 0) {
              const datainputted = data1[0];
              const datainventory = data2[0];

              db1.query(query3, [rasaID], (error, eventData) => {
                if (error) {
                  throw error;
                } else {
                  if (eventData.length > 0) {
                    const { event_day, start_time, end_time } = eventData[0];

                    // Console.log the obtained values
                    console.log("Event Day:", event_day);
                    console.log("Start Time:", start_time);
                    console.log("End Time:", end_time);

                    getEvents(
                      event_day,
                      start_time,
                      end_time,
                      (err, eventResults) => {
                        if (err) {
                          throw err;
                        } else {
                          console.log(eventResults);
                        }
                        res.locals.rasaID = rasaID;
                        res.render("submitrasa", {
                          rasaID,
                          datainputted,
                          datainventory,
                          universalId,
                          eventResults,
                        });
                      }
                    );
                  } else {
                    console.log("Event data not found");
                  }
                }
              });
            } else {
              res.status(404).send("Data from second table not found");
            }
          }
        });
      } else {
        res.status(404).send("Data from first table not found");
      }
    }
  });
});

router.get("/editUserView", adminMiddleware, (req, res) => {
  res.sendFile("editUserView.html", { root: "./public" });
});

router.get("/rasa", loggedIn, (req, res) => {
  const universalId = req.session.universalId;

  // Check if universalId is null
  if (universalId === null || universalId === undefined) {
    // Redirect to "/"
    return res.redirect("/");
  }

  // Assuming db1 is your database connection
  db1.query('SELECT * FROM user WHERE id = ?', [universalId], (error, results) => {
    if (error) {
      // Handle the error
      console.error(error);
      return res.status(500).send('Internal Server Error');
    }
    if (results.length === 0) {
      return res.redirect("/");
    }

    const userId = results[0].user_id;
    const requestor_information = results[0].requestor_information;
    const contact_number = results[0].contact_number;
    const course = results[0].course;
    const full_name = results[0].full_name;
    console.log(universalId)
    console.log(userId)

    res.render("rasa", { id: universalId, user_id: userId, requestor_information, contact_number, course, full_name });
  });
});

app.get("/fetch-data", (req, res) => {
  const month = req.query.month;
  const year = req.query.year;

  const inputtedQuery = `
    SELECT
      it.id AS id,
      it.event_day,
      it.event_name,
      it.event_description,
      it.required_day,
      inventory_table.*
    FROM inputted_table it
    LEFT JOIN inventory_table ON it.id = inventory_table.inventory_id
    WHERE MONTH(it.event_day) = ? AND YEAR(it.event_day) = ?;`;

  db1.query(inputtedQuery, [month, year], (inputtedError, inputtedResults) => {
    if (inputtedError) {
      console.error(inputtedError);
      res.status(500).json({ error: "An error occurred while fetching data" });
    } else {
      const extendedData = [];

      inputtedResults.forEach((row) => {
        const requiredDay = parseInt(row.required_day);

        const eventDate = new Date(row.event_day);
        eventDate.setDate(eventDate.getDate() - 1);

        for (let i = 0; i < requiredDay; i++) {
          const newRow = { ...row };
          eventDate.setDate(eventDate.getDate() + 1);
          newRow.event_day = eventDate.toISOString().slice(0, 10);
          extendedData.push(newRow);
        }
      });
      res.json(extendedData);
    }
  });
});

app.get("/fetch-calendar", (req, res) => {
  const month = req.query.month;
  const year = req.query.year;

  const calendarQuery = `
    SELECT *
    FROM calendar_input
    WHERE MONTH(event_day) = ? AND YEAR(event_day) = ?;`;

  db1.query(calendarQuery, [month, year], (calendarError, calendarResults) => {
    if (calendarError) {
      console.error(calendarError);
      res.status(500).json({ error: "An error occurred while fetching data" });
    } else {
      res.json(calendarResults);
    }
})
})

app.get("/fetch-inventory-max", (req, res) => {
  const inventoryMaxQuery = `
    SELECT *
    FROM inventory_max
    ORDER BY id DESC
    LIMIT 1;`;

  db1.query(inventoryMaxQuery, (inventoryMaxError, inventoryMaxResults) => {
    if (inventoryMaxError) {
      console.error(inventoryMaxError);
      res.status(500).json({ error: "An error occurred while fetching inventory_max data" });
    } else {
      res.json(inventoryMaxResults[0]); // Assuming you want to send a single row
    }
  });
});


router.get("/inventory", (req, res) => {
  res.sendFile("inventory.html", { root: "./public/" });
});

router.get("/inventory123", loggedIn, dashboardAccessMiddleware, (req, res) => {
  const query1 = "SELECT * FROM inputted_table";
  const query2 = "SELECT * FROM inventory_table";

  Promise.all([
    new Promise((resolve, reject) => {
      db1.query(query1, (error, inputtedData) => {
        if (error) {
          reject(error);
        } else {
          resolve(inputtedData);
        }
      });
    }),
    new Promise((resolve, reject) => {
      db1.query(query2, (error, inventoryData) => {
        if (error) {
          reject(error);
        } else {
          resolve(inventoryData);
        }
      });
    }),
  ])
    .then(([inputtedData, inventoryData]) => {
      const combinedData = {
        inputtedData: inputtedData,
        inventoryData: inventoryData,
      };
      res.json(combinedData);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("An error occurred while fetching data");
    });
});

router.get("/newregister", (req, res) => {
  res.sendFile("newregister.html", { root: "./public/" });
});

router.get("/userview", loggedIn, adminMiddleware, (req, res) => {
  var query = "SELECT * FROM user ORDER BY id DESC";
  db1.query(query, function (error, data) {
    if (error) {
      throw error;
    } else {
      res.render("user-view", {
        title: "Node.js MySQL CRUD Application",
        action: "list",
        sampleData: data,
      });
    }
  });
});

// http://localhost:3005/rasaview
router.get("/rasaview", loggedIn, adminMiddleware, (req, res) => {
  const itemsPerPage = 15;
  const currentPage = parseInt(req.query.page) || 1;
  const offset = (currentPage - 1) * itemsPerPage;

  const query = `
    SELECT i.id as inputted_id, i.*, iv.* 
    FROM inputted_table i
    LEFT JOIN inventory_table iv ON i.id = iv.inventory_id
    WHERE i.authenticated != 1 
    ORDER BY i.id DESC 
    LIMIT ?, ?`;

  db1.query(query, [offset, itemsPerPage], (error, data) => {
    if (error) {
      throw error;
    } else {
      res.render("rasa_viewAdmin", {
        title: "Node.js MySQL CRUD Application",
        action: "list",
        sampleData: data,
        currentPage: currentPage,
        itemsPerPage: itemsPerPage,
      });
    }
  });
});

router.post("/api/updateAuthenticated/:id", (req, res) => {
  const id = req.params.id;
  const query = "UPDATE inputted_table SET authenticated = 1 WHERE id = ?";

  db1.query(query, [id], (error, results) => {
    if (error) {
      console.error("Error updating authenticated:", error);
      res.status(500).json({ message: "Error updating authenticated" });
    } else {
      console.log("Authenticated successfully");

      res.json({ message: "Authenticated updated successfully" });
    }
  });
});

router.get("/rasaview/:id", checkUniversalCodeMiddleware, (req, res) => {
  const hashedId = req.params.id;
  const universalId = req.session.universalId;

  const encryptedId = encryptId(hashedId);
  const originalId = decryptId(encryptedId);

  const itemsPerPage = 15;
  const currentPage = parseInt(req.query.page) || 1;
  const offset = (currentPage - 1) * itemsPerPage;

  try {
    console.log("hashedId:", hashedId);
    console.log("encryptedId", encryptedId);

    if (isNaN(hashedId) || hashedId !== universalId) {
      res
        .status(403)
        .send("Access denied: You do not have permission to view this page.");
      return;
    }

    const query =
      "SELECT * FROM inputted_table WHERE user_id = ? ORDER BY id DESC LIMIT ?, ?";
    db1.query(query, [hashedId, offset, itemsPerPage], (error, data) => {
      if (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data.");
      } else {
        const sampleData = data.map((item) => {
          return {
            ...item,
            encryptedId: encryptId(item.id),
          };
        });

        res.render("rasa_view", {
          title: "Node.js MySQL CRUD Application",
          action: "list",
          sampleData: sampleData,
          id: hashedId,
          encryptedId: encryptedId,
          currentPage: currentPage,
          totalPages: Math.ceil(data.length / itemsPerPage),
        });
      }
    });
  } catch (error) {
    console.error("Decryption error:", error);
    console.log("error");
    console.log("hashedId:", hashedId);
    console.log("originalId after decryption:", originalId);
    console.log("userid: ", userId);
    res.status(500).send("Error decrypting the ID.");
  }
});

router.get("/calendar", (req, res) => {
  if (req.user) {
    res.sendFile("calendar.html", { root: "./public/" });
  } else {
    const message = "You need to log in to access the calendar.";
    res.render("login", { message: message });
  }
});

router.get("/calendar12", loggedIn, dashboardAccessMiddleware, (req, res) => {
  res.render("calendar", { id: universalId });
});

router.get(
  "/calendarAdmin",
  loggedIn,
  dashboardAccessMiddleware,
  adminMiddleware,
  (req, res) => {
    res.sendFile("calendarAdmin.html", { root: "./public/" });
  }
);

router.get(
  "/accesorAdmin",
  /*loggedIn, adminMiddleware,*/ (req, res) => {
    res.sendFile("accesor_admin.html", { root: "./public/" });
  }
);

router.get("/accesorRegular", loggedIn, (req, res) => {
  if (req.user) {
    res.sendFile("accesor_regular.html", { root: "./public/" });
  } else {
    // message
    const message = "You need to log in to access the accessor regular page.";
    res.render("login", { message: message });
  }
});

router.get("/editUserView/:id", (req, res) => {
  const userId = req.params.id;
  console.log(userId);

  const query = "SELECT * FROM user WHERE id = ?";
  db1.query(query, [userId], function (error, data) {
    if (error) {
      throw error;
    } else {
      if (data.length > 0) {
        const user = data[0];
        res.locals.userId = userId;
        res.render("editUserView1", { user: user });
      } else {
        res.status(404).send("Rasa form is not found");
      }
    }
  });
});

router.get("/pdf1/:id", async (req, res) => {
  const puppeteer = require("puppeteer");
  const rasaID = req.params.id;
  //const url = `http://localhost:3005/ejsrasaVanilla/${rasaID}`;
  const url = `http://154.41.254.18:3306/ejsrasaVanilla/${rasaID}`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 941, height: 700 }); // Width
    await page.goto(url, { waitUntil: "load" });
    const pdfBuffer = await page.pdf();
    await browser.close();

    const pdfFileName = `rasa_${rasaID}.pdf`;
    const filePath = path.join(__dirname, "public", "pdf-folders", pdfFileName);
    const directoryPath = path.join(__dirname, "public", "pdf-folders");
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
    fs.writeFileSync(filePath, pdfBuffer);
    res.download(filePath, (error) => {
      console.log(filePath);
      fs.unlinkSync(filePath);
    });
    /*
     const sql = "UPDATE inputted_table SET pdf = ? WHERE id = ?";
    db1.query(sql, [pdfFileName, rasaID], function (error, result) {
      if (error) {
        console.error(error);
        res.status(500).send("An error occurred while updating the table");
      } else {
        console.log(
          `PDF successfully generated and saved in pdf-folders. RasaId = ${rasaID}`
        );
        res.download(filePath);
    });
      }*/
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while generating PDF");
  }
});

router.get("/pdf2/:encryptedId", async (req, res) => {
  const puppeteer = require("puppeteer");
  const encryptedId = req.params.encryptedId;
  const decryptedId = decryptId(encryptedId);

  if (decryptedId === null) {
    return res.status(400).send("Invalid encrypted ID");
  }

  //const url = `http://localhost:3005/ejsrasaVanilla/${decryptedId}`;
  const url = `http://154.41.254.18:3306/ejsrasaVanilla/${decryptedId}`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 941, height: 700 });
    await page.goto(url, { waitUntil: "load" });
    const pdfBuffer = await page.pdf();
    await browser.close();

    const pdfFileName = `rasa_${decryptedId}.pdf`;
    const filePath = path.join(__dirname, "public", "pdf-folders", pdfFileName);
    const directoryPath = path.join(__dirname, "public", "pdf-folders");
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
    fs.writeFileSync(filePath, pdfBuffer);
    res.download(filePath, (error) => {
      console.log(filePath);
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while generating PDF");
  }
});

router.get("/delete/:id", async (req, res) => {
  const userID = req.params.id;

  try {
    // Fetch user data from 'user' table
    const selectSql = "SELECT * FROM user WHERE id = ?";
    const [result] = await db1.query(selectSql, [userID]);

    if (!result.length) {
      return res.status(404).send("The provided ID does not exist in the user");
    }

    const userData = result[0];

    // Insert fetched user data into 'archived_users' table
    const insertSql =
      "INSERT INTO archived_users (id, email, password, role, pending) VALUES (?, ?, ?, ?, ?)";
    const [insertResult] = await db1.query(insertSql, [
      userData.id,
      userData.email,
      userData.password,
      userData.role,
      userData.pending,
    ]);

    // Delete user data from 'user' table
    const deleteSql = "DELETE FROM user WHERE id = ?";
    const [deleteResult] = await db1.query(deleteSql, [userID]);

    res
      .status(200)
      .send(
        "Data successfully deleted from user and transferred to archived_users"
      );
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the request");
  }
});

router.get("/delete_rasa_request/:id", async (req, res) => {
  const rasaID = req.params.id;
  try {
    const selectSql = "SELECT * FROM inputted_table WHERE id = ?";
    db1.query(selectSql, [rasaID], function (error, result) {
      if (error) {
        console.error(error);
        return res
          .status(500)
          .send("An error occurred while fetching the data to be deleted");
      }
      if (!result.length) {
        return res
          .status(404)
          .send("The provided ID does not exist in the inputted_table");
      }
      const data = result[0];
      const insertSql =
        "INSERT INTO archieved_inputted_table2 (rasa_id, full_name, event_day, event_name, event_description, start_time, end_time, rasa_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      db1.query(
        insertSql,
        [
          data.id,
          data.full_name,
          data.event_day,
          data.event_name,
          data.event_description,
          data.start_time,
          data.end_time,
          data.rasa_status,
        ],
        function (error, result) {
          if (error) {
            console.error(error);
            return res
              .status(500)
              .send(
                "An error occurred while transferring the data to the archieve_inputted_table"
              );
          }
          const deleteSql = "DELETE FROM inputted_table WHERE id = ?";
          db1.query(deleteSql, [rasaID], function (error, result) {
            if (error) {
              console.error(error);
              return res
                .status(500)
                .send(
                  "An error occurred while deleting the data from the inputted_table"
                );
            }
            res
              .status(200)
              .send(
                "Data successfully deleted from inputted_table and transferred to archieve_inputted_table"
              );
          });
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the request");
  }
});

router.get("/approve/:id", (req, res) => {
  const userId = req.params.id;
  db1.query(
    "UPDATE user SET pending = 1 WHERE id = ?",
    [userId],
    (error, results) => {
      if (error) {
        return res.json({
          status: "error",
          error: "Error approving user",
        });
      }
      return res.redirect("/userview"); // Redirect to the '/userview'
    }
  );
});

async function generatePDF(id) {
  const puppeteer = require("puppeteer");
  //const url = `http://localhost:3005/ejsrasaVanilla/${id}`;
  const url = `http://154.41.254.18:3306/ejsrasaVanilla/${id}`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 941, height: 700 });
    await page.goto(url, { waitUntil: "load" });
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    const pdfBuffer = await page.pdf();
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error(error);
    throw Error("An error occurred while generating PDF");
  }
}
// verification1
router.get("/verification/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const hashedId = encryptId(id);
    const isOverlapped = await checkOverlapped(id);
    if (isOverlapped) {
      return res
        .status(400)
        .send("Overlap found. Cannot proceed with verification. Contact Building Admin");
    }
    console.log("No overlap found. Proceeding with verification.");

    try {
      const isSufficient = await checkSufficient(id);
      if (isSufficient && isSufficient.status === 400) {
        return res.status(400).send(isSufficient.message);
      }
      console.log("Sufficient Inventory. Proceeding with verification.");
    } catch (error) {
      console.error(error);
      return res.status(500).send("An error occurred while checking sufficiency");
    }

    const number = 1;
    const encryptedNumber = encryptId(number);
    let email;
    console.log("----------------------------------------");
    console.log("/verification");
    console.log("id : ", id);
    console.log("hashedId : ", hashedId);

    const accounts = [
      [
        "Information & Communications Technology: People 1",
        "lopez.195633@globalcity.sti.edu.ph",
      ],
      [
        "Business & Management: People 1",
        "magistrado.222133@globalcity.sti.edu.ph",
      ],
      [
        "Hospitality Management: People 1",
        "rodillas.222275@globalcity.sti.edu.ph.com",
      ],
      [
        "Mr. Joseph Transmontero",
        "lopez.195633@globalcity.sti.edu.ph",
      ],
      [
        "Mr. Mac Salonga",
        "magistrado.222133@globalcity.sti.edu.ph",
      ],
      [
        "Ms. Anne Bartolome",
        "rodillas.222275@globalcity.sti.edu.ph.com",
      ],
    ];

    const query = `SELECT endorsed FROM inputted_table WHERE id = ${id}`;
    const results = await new Promise((resolve, reject) => {
      db1.query(query, (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });

    if (results.length > 0) {
      const endorsedValue = results[0].endorsed;
      let emailFound = false;
      for (const account of accounts) {
        if (endorsedValue === account[0]) {
          email = account[1];
          console.log(email);
          emailFound = true;
          break;
        }
      }

      if (!emailFound && (endorsedValue === "N/A" || endorsedValue === "")) {
        email = "rodillas.222275@globalcity.sti.edu.ph";
      }
      console.log("email: ", email);
      const pdfFileName = `rasa_${id}.pdf`;
      //const encryptedEmail = encryptId(email);
      const html = `
        <h1>Rasa for Approval Email</h1>
        <a href="http://154.41.254.18:3306/approveRasa/${id}/${number}/${email}" style="background-color: green; color: white; padding: 10px; text-decoration: none;">Approve Rasa</a>
        <a href="http://154.41.254.18:3306/disregardRasa/${id}/${number}" style="background-color: red; color: white; padding: 10px; text-decoration: none;">Disregard Rasa</a>
      `;

      // Update rasa_status
      const updateSql =
        "UPDATE inputted_table SET rasa_status = ? WHERE id = ?";
      db1.query(
        updateSql,
        [`Step 1: Waiting for approval of ${email}`, id],
        (error, result) => {
          if (error) {
            console.error(error);
            return res.status(500).send("Error updating rasa_status");
          }
          console.log(
            `rasa_status updated to waiting for email of ${email} for ID: ${id}`
          );
          sendEmail(id, email, hashedId, pdfFileName, html, res);
        }
      );
    } else {
      console.log("No matching record found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the request");
  }
});

async function sendEmail(id, email, hashedId, pdfFileName, html, res) {
  try {
    const pdfBuffer = await generatePDF(id);

    const transporter = nodemailer.createTransport({
      service: "hotmail",
      auth: {
        user: ACCOUNT_USER,
        pass: ACCOUNT_PASSWORD,
        /*
        user: "rodillas.222275@globalcity.sti.edu.ph",
        pass: "Idontknow16221",
        */
      },
    });

    transporter.sendMail(
      {
        from: "STI-Building Administration <rodillas.222275@globalcity.sti.edu.ph>",
        to: email,
        subject: "First Signature:",
        html: html,
        attachments: [
          {
            filename: `Rasa_File_${id}.pdf`,
            content: pdfBuffer,
          },
        ],
      },
      (error, info) => {
        if (error) {
          console.error(error);
          return res
            .status(500)
            .send("An error occurred while sending the email");
        }
        console.log("Message Sent: " + info.messageId + email);
        console.log("Preview URL: " + nodemailer.getTestMessageUrl(info));
        const alertScript = `
        <script>
          alert('Email sent successfully to ${id}');
          window.location.href = '/rasaview';
        </script>
      `;

        res.send(alertScript);
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while sending the email");
  }
}

async function checkOverlapped(id, res) {
  return new Promise(async (resolve, reject) => {
    try {
      // First query to get selectedArray
      const selectedArray = await new Promise((resolve, reject) => {
        db1.query(
          `SELECT * FROM inventory_table where inventory_id = ${id}`,
          (error, results) => {
            if (error) {
              reject(error);
            } else {
              const selectedColumns = [];
              const columns = [
                "auditorium",
                "foodandbeverage",
                "multihall",
                "dancestudio",
                "gym",
                "classroom",
                "kitchen",
                "mainlobby",
              ];
              columns.forEach((column) => {
                const hasValueOne = results.some((row) => row[column] === 1);
                if (hasValueOne) {
                  selectedColumns.push(column);
                }
              });
              resolve(selectedColumns);
            }
          }
        );
      });

      console.log(selectedArray + " === selected array ");
      // Second query to get event_day, start_time, and end_time from inputted_table
      const resultsFromSecondQuery = await new Promise((resolve, reject) => {
        db1.query(
          `SELECT event_day, start_time, end_time FROM inputted_table WHERE id = ${id}`,
          (error, results) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          }
        );
      });

      if (resultsFromSecondQuery.length > 0) {
        const { event_day, start_time, end_time } = resultsFromSecondQuery[0];
        console.log("Event Day:", event_day);
        console.log("Start Time:", start_time);
        console.log("End Time:", end_time);

        // Third query
        const venueConditions = selectedArray
          .map((venue) => `${venue} = 1`)
          .join(" OR ");

        db1.query(
          `SELECT * FROM calendar_input WHERE event_day = ? AND 
           ((CAST(? AS TIME) >= start_time AND CAST(? AS TIME) < end_time) OR 
            (CAST(? AS TIME) > start_time AND CAST(? AS TIME) <= end_time) OR 
            (CAST(? AS TIME) <= start_time AND CAST(? AS TIME) >= end_time)) AND 
           (${venueConditions})`,
          [
            event_day,
            start_time,
            start_time,
            end_time,
            end_time,
            start_time,
            end_time,
          ],
          (error, overlappingResults) => {
            if (error) {
              console.error("Error executing the query:", error);
              reject(error);
            } else {
              console.log(
                "Overlapping events in calendar_input:",
                overlappingResults
              );

              if (overlappingResults.length > 0) {
                console.log("Overlapping events found. Aborting insertion.");
                // Update the inputted_table fields
                db1.query(
                  "UPDATE inputted_table SET authenticated = ?, rasa_note_void = ?, rasa_status = ? WHERE id = ?",
                  [300, "Contact Building Administrator","Overlapping Event Found. Contact Building Administrator", id],
                  (updateError, updateResults) => {
                    if (updateError) {
                      console.error("Error updating inputted_table:", updateError);
                      if (res && res.status) {
                        res.status(500).json({
                          status: "error",
                          error: "Error updating data in inputted_table.",
                        });
                      }
                    } else {
                      console.log("Updated inputted_table with overlapping event information.");
                      if (res && res.status) {
                        res.status(400).json({
                          //status: "aborted",
                          error: "Overlapping event found in calendar_table. Please choose a different time.",
                        });
                      }
                    }
                  }
                );
              } else {
                console.log(
                  "No overlapping events found. Proceed with insertion."
                );
                resolve(false);
              }
            }
          }
        );
      } else {
        console.log("No records found in inputted_table for id:", id);
        resolve(false); // Resolve with false when no records are found
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

async function checkSufficient(id) {
  return new Promise((resolve, reject) => {
    db1.query(
      "SELECT event_day, start_time, end_time FROM inputted_table WHERE id = ?",
      [id],
      (error, result) => {
        if (error) {
          console.error("Error executing the query:", error);
          reject(error);
          return;
        }

        const [row] = result;
        if (!row) {
          const noDataRowError = new Error("No data found for the specified ID.");
          console.error(noDataRowError.message);
          reject(noDataRowError);
          return;
        }

        const { event_day, start_time, end_time } = row;

        db1.query(
          "SELECT * FROM inventory_table WHERE inventory_id = ?",
          [id],
          (error, inventoryData) => {
            if (error) {
              console.error("Error executing the query:", error);
              reject(error);
              return;
            }

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
                  reject(error);
                  return;
                }
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
                    db1.query(
                      "UPDATE inputted_table SET authenticated = 200, rasa_note_void = 'sufficient equipment, rasa_status = 'Insufficient Equipment. Contact Building Administrator'. Contact Building Admin' WHERE id = ?",
                      [id],
                      (updateError, updateResult) => {
                        if (updateError) {
                          console.error("Error updating inputted_table:", updateError);
                          reject(updateError);
                          return;
                        }
  
                        console.log("Inputted_table updated successfully.");
                        resolve({
                          status: 400,
                          message: "Sufficient Equipment",
                        });
                      }
                    );
                  } else {
                    resolve({
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
                }
              );
            }
          );
        }
      );
    });
  }

router.get("/verificationHRM/:id", async (req, res) => {
  try {
    console.log(ACCOUNT_PASSWORD);
    console.log(ACCOUNT_USER);
    const id = req.params.id;
    const isOverlapped = await checkOverlapped(id);
    if (isOverlapped) {
      return res
        .status(400)
        .send("Overlap found. Cannot proceed with verification. Contact Building Admin");
    }
    console.log("No overlap found. Proceeding with verification.");

    try {
      const isSufficient = await checkSufficient(id);
      if (isSufficient && isSufficient.status === 400) {
        return res.status(400).send(isSufficient.message);
      }
      console.log("Sufficient Inventory. Proceeding with verification.");
    } catch (error) {
      console.error(error);
      return res.status(500).send("An error occurred while checking sufficiency");
    }
    
    const hashedId = encryptId(id);
    const number = 21;
    const encryptedNumber = encryptId(number); // encrypt email
    console.log("----------------------------------------");
    console.log("/verificationHRM");
    console.log("id : ", id);
    console.log("hashedId : ", hashedId);
    let email = "baruc.231345@globalcity.sti.edu.ph";

    const pdfFileName = `rasa_${id}.pdf`;
    const encryptedEmail = encryptId(email);
    const html = `
        <h1>Rasa for Approval Email</h1>
        <a href="http://154.41.254.18:3306/approveRasa/${id}/${number}/${email}" style="background-color: green; color: white; padding: 10px; text-decoration: none;">Approve Rasa</a>
        <a href="http://154.41.254.18:3306/disregardRasa/${id}/${number}" style="background-color: red; color: white; padding: 10px; text-decoration: none;">Disregard Rasa</a>
      `;

    const updateSql = "UPDATE inputted_table SET rasa_status = ? WHERE id = ?";
    db1.query(
      updateSql,
      [`Approval of HRM Custodian: ${email}`, id],
      (error, result) => {
        if (error) {
          console.error(error);
          return res.status(500).send("Error updating rasa_status");
        }
        console.log(
          `rasa_status updated to waiting for email of ${email} for ID: ${id}`
        );
        sendEmail_Kitchen(id, email, hashedId, pdfFileName, html, res);
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the request");
  }
});

async function sendEmail_Kitchen(id, email, hashedId, pdfFileName, html, res) {
  try {
    const pdfBuffer = await generatePDF(id);

    const transporter = nodemailer.createTransport({
      service: "hotmail",
      /*
      auth: {
        user: "processtest2@outlook.ph",
        pass: "cwbomrdgiphyvvnz",
      },
      */
      /*
      auth: {
        user: "rodillas.222275@globalcity.sti.edu.ph",
        pass: "Idontknow16221",
      },
      */
      auth: {
        user: ACCOUNT_USER,
        pass: ACCOUNT_PASSWORD,
      },
    });

    transporter.sendMail(
      {
        from: "STI-Building Administration <rodillas.222275@globalcity.sti.edu.ph>",
        to: email,
        subject: "HRM Custodian Signature:",
        html: html,
        attachments: [
          {
            filename: `Rasa_File_${id}.pdf`,
            content: pdfBuffer,
          },
        ],
      },
      (error, info) => {
        if (error) {
          console.error(error);
          return res
            .status(500)
            .send("An error occurred while sending the email");
        }
        console.log("Message Sent HRM: " + info.messageId);
        console.log("Preview URL:", nodemailer.getTestMessageUrl(info)); // FALSE URL
        const alertScript = `
        <script>
          alert('Email sent successfully to ${id}');
          window.location.href = '/rasaview';
        </script>
      `;

        res.send(alertScript);
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while sending the email");
  }
}

// digit yung isesend natin instead of number sa approverasa Route for kitchen and classroom
// if 30 yung digit, deretso sa verificationHRM
// if 31 yung digit, deretso sa verification
router.get("/verificationClassroom/:id/:digit", async (req, res) => {
  try {
    console.log(ACCOUNT_PASSWORD);
    console.log(ACCOUNT_USER);
    const id = req.params.id;
    const digit = req.params.digit;
    const hashedId = encryptId(id);
    const number = 20;
    const encryptedNumber = encryptId(number);

    console.log("----------------------------------------");
    console.log("/verificationClassroom");
    console.log("password:", ACCOUNT_PASSWORD);
    console.log("user:", ACCOUNT_USER);
    console.log("digit", digit);
    console.log("id : ", id);
    console.log("hashedId : ", hashedId);
    let email = "magistrado.222133@globalcity.sti.edu.ph";

    const isOverlapped = await checkOverlapped(id);
    if (isOverlapped) {
      return res
        .status(400)
        .send("Overlap found. Cannot proceed with verification. Contact Building Admin");
    }
    console.log("No overlap found. Proceeding with verification.");

    try {
      const isSufficient = await checkSufficient(id);
      if (isSufficient && isSufficient.status === 400) {
        return res.status(400).send(isSufficient.message);
      }
      console.log("Sufficient Inventory. Proceeding with verification.");
    } catch (error) {
      console.error(error);
      return res.status(500).send("An error occurred while checking sufficiency");
    }

    const pdfFileName = `rasa_${id}.pdf`;
    const encryptedEmail = encryptId(email);
    const html = `
        <h1>Rasa for Classroom Facilitator Email</h1>
        <a href="http://154.41.254.18:3306/approveRasa/${id}/${digit}/${email}" style="background-color: green; color: white; padding: 10px; text-decoration: none;">Approve Rasa</a>
        <a href="http://154.41.254.18:3306/disregardRasa/${id}/${digit}" style="background-color: red; color: white; padding: 10px; text-decoration: none;">Disregard Rasa</a>
      `;

    const updateSql = "UPDATE inputted_table SET rasa_status = ? WHERE id = ?";
    db1.query(
      updateSql,
      [`Approval of Classroom Facilitator : ${email}`, id],
      (error, result) => {
        if (error) {
          console.error(error);
          return res.status(500).send("Error updating rasa_status");
        }
        console.log(
          `rasa_status updated to waiting for email of ${email} for ID: ${id}`
        );
        sendEmail_Classroom(id, email, hashedId, pdfFileName, html, res);
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the request");
  }
});
async function sendEmail_Classroom(
  id,
  email,
  hashedId,
  pdfFileName,
  html,
  res
) {
  try {
    const pdfBuffer = await generatePDF(id);

    const transporter = nodemailer.createTransport({
      service: "hotmail",
      /*
      auth: {
        user: "processtest2@outlook.ph",
        pass: "cwbomrdgiphyvvnz",
      },
      */
      auth: {
        user: ACCOUNT_USER,
        pass: ACCOUNT_PASSWORD,
        /*
        user: "rodillas.222275@globalcity.sti.edu.ph",
        pass: "Idontknow16221",
        */
      },
    });

    transporter.sendMail(
      {
        from: "STI-Building Administration <rodillas.222275@globalcity.sti.edu.ph>",
        to: email,
        subject: "Classroom Facilitator Signature:",
        html: html,
        attachments: [
          {
            filename: `Rasa_File_${id}.pdf`,
            content: pdfBuffer,
          },
        ],
      },
      (error, info) => {
        if (error) {
          console.error(error);
          return res
            .status(500)
            .send("An error occurred while sending the email");
        }
        console.log("Message Sent Classroom Facilitator: " + info.messageId);
        console.log("Preview URL:", nodemailer.getTestMessageUrl(info)); // Log preview URL
        const alertScript = `
        <script>
          alert('Email sent successfully to ${id}');
          window.location.href = '/rasaview';
        </script>
      `;

        res.send(alertScript);
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while sending the email");
  }
}

router.get("/approveRasa/:hashedId/:encryptedNumber/:encryptedEmail",
  async (req, res) => {
    const encryptedId = req.params.hashedId; // 1221
    const encryptedNumber = req.params.encryptedNumber; // dsasdase21231
    const encryptedEmail = req.params.encryptedEmail; // 128368712637813

    const query1 = "SELECT * FROM inputted_table WHERE id = ?";
    const query2 = "SELECT * FROM inventory_table WHERE inventory_id = ?";
    db1.query(query1, [encryptedId], (error, data1) => {
      if (error) {
        throw error;
      } else {
        if (data1.length > 0) {
          db1.query(query2, [encryptedId], (error, data2) => {
            if (error) {
              console.error("Error fetching data from inventory_table:", error);
              throw error;
            } else {
              if (data2.length > 0) {
                const datainputted = data1[0];
                const datainventory = data2[0];
                res.render("approveRasa", {
                  datainputted,
                  datainventory,
                  encryptedNumber,
                  encryptedEmail,
                  encryptedId,
                });
              } else {
                res.status(404).send("Data from second table not found");
              }
            }
          });
        } else {
          res.status(404).send("Data from first table not found");
        }
      }
    });
  }
);


router.get("/disregardRasa/:hashedId/:encryptedNumber", async (req, res) => {
  const hashedId = req.params.hashedId;
  const encryptedNumber = req.params.encryptedNumber;
  const encryptedId = encryptId(hashedId);

  console.log("------------------------------");
  console.log("----disregardRasa------");
  console.log(hashedId);
  console.log(encryptedNumber);
  console.log(encryptedId);

  const query1 = "SELECT * FROM inputted_table WHERE id = ?";
  const query2 = "SELECT * FROM inventory_table WHERE inventory_id = ?";
  db1.query(query1, [hashedId], (error, data1) => {
    if (error) {
      throw error;
    } else {
      if (data1.length > 0) {
        db1.query(query2, [hashedId], (error, data2) => {
          if (error) {
            console.error("Error fetching data from inventory_table:", error);
            throw error;
          } else {
            if (data2.length > 0) {
              const datainputted = data1[0];
              const datainventory = data2[0];
              res.render("disregardRasa", {
                datainputted,
                datainventory,
                encryptedNumber,
                encryptedId,
              });
            } else {
              res.status(404).send("Data from second table not found");
            }
          }
        });
      } else {
        res.status(404).send("Data from first table not found");
      }
    }
  });
});

let isProcessing = false;
router.get("/verification2/:hashedId", async (req, res) => {
  isProcessing = true;
  try {
    const hashedId = req.params.hashedId; // change from orginalId to hashedId para ma remove yung decrypt
    //const hashedId = decryptId(originalId);
    // const encryptedId = encryptId(hashedId);
    const isOverlapped = await checkOverlapped(hashedId);
    if (isOverlapped) {
      return res
        .status(400)
        .send("Overlap found. Cannot proceed with verification. Contact Building Admin");
    }
    console.log("No overlap found. Proceeding with verification.");

    try {
      const isSufficient = await checkSufficient(hashedId);
      if (isSufficient && isSufficient.status === 400) {
        return res.status(400).send(isSufficient.message);
      }
      console.log("Sufficient Inventory. Proceeding with verification.");
    } catch (error) {
      console.error(error);
      return res.status(500).send("An error occurred while checking sufficiency");
    }

    console.log("Sufficient Inventory. Proceeding with verification.");
    console.log("Sufficient Inventory. Proceeding with verification."); 
    const number = 2;
    console.log("----------------------------------------");
    console.log("/verification2");
    //console.log("originalId : ", originalId);
    //console.log("hashedId : ", hashedId);
    // console.log("encryptedId : ", encryptedId);
    console.log("number", number);

    const query1 = "SELECT * FROM inputted_table WHERE id = ?";
    const query2 = "SELECT * FROM inventory_table WHERE inventory_id = ?";

    db1.query(query1, [hashedId], (error, data1) => {
      if (error) {
        throw error;
      }

      if (data1.length > 0) {
        db1.query(query2, [hashedId], (error, data2) => {
          if (error) {
            console.error("Error fetching data from inventory_table:", error);
            throw error;
          }

          if (data2.length > 0) {
            const datainputted = data1[0];
            const datainventory = data2[0];

            const email = "baruc.231345@globalcity.sti.edu.ph";
            const html = `
              <h1>Rasa for Approval Email</h1>
              <a href="http://154.41.254.18:3306/approveRasa/${hashedId}/${number}/${email}" style="background-color: green; color: white; padding: 10px; text-decoration: none;">Approve Rasa</a>
              <a href="http://154.41.254.18:3306/disregardRasa/${hashedId}/${number}" style="background-color: red; color: white; padding: 10px; text-decoration: none;">Disregard Rasa</a>
            `;

            const updateSql =
              "UPDATE inputted_table SET rasa_status = ? WHERE id = ?";
            db1.query(
              updateSql,
              [`Step 4: Sending email to ${email}`, hashedId],
              (error, result) => {
                if (error) {
                  console.error(error);
                  handleUpdateError(res, hashedId);
                } else {
                  console.log(
                    "Step 5: This is Signature 2: rasa_status updated to waiting for an email from " +
                      email +
                      " for ID: " +
                      hashedId
                  );
                  generatePDF(hashedId)
                    .then((pdfBuffer) => {
                      sendApprovalEmail(res, email, html, hashedId, pdfBuffer);
                    })
                    .catch((pdfError) => {
                      console.error(pdfError);
                      return res
                        .status(500)
                        .send("An error occurred while generating PDF");
                    });
                }
              }
            );
          } else {
            res.status(404).send("Data from the second table not found");
          }
        });
      } else {
        res.status(404).send("Data from the first table not found");
      }
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send("An error occurred while updating rasa_status and sending email");
  } finally {
    isProcessing = false;
  }
});

function handleUpdateError(res, hashedId) {
  const updateErrorSql =
    "UPDATE inputted_table SET rasa_status = ? WHERE id = ?";
  db1.query(
    updateErrorSql,
    [
      `Step 4.5 / Signature 2 - Error 500: Sending Rasa to Email is Failed`,
      hashedId,
    ],
    (error) => {
      if (error) {
        console.error(error);
        return res
          .status(500)
          .send("An error occurred while updating rasa_status");
      }
      return res
        .status(500)
        .send(
          "An error occurred while sending email. rasa_status updated to Error 500: Sending Rasa to Email is Failed"
        );
    }
  );
}

function sendApprovalEmail(res, email, html, hashedId, pdfBuffer) {
  const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
      user: ACCOUNT_USER,
      pass: ACCOUNT_PASSWORD,
    },
  });

  transporter.sendMail(
    {
      from: "STI-Building Administration <rodillas.222275@globalcity.sti.edu.ph>",
      to: email,
      subject: "Second Signature:",
      html: html,
      attachments: [
        {
          filename: `Rasa_File_${hashedId}.pdf`,
          content: pdfBuffer,
        },
      ],
    },
    (error, info) => {
      if (error) {
        console.error(error);
        return res
          .status(500)
          .send("An error occurred while sending the email");
      }
      console.log("Message Sent 2 : " + info.messageId);
      res.redirect(`/ejsrasaVanilla2/${encryptedId}`);
    }
  );
}

//getSignature1
router.get("/getSignature/:id", async (req, res) => {
  try {
    const id = req.params.id; // s21edcsasd5721321313
    const hashedId = decryptId(id); // 484
    const encryptedId = encryptId(hashedId); //s21edcsasd5721321313
    const defaultSignatureid = 8;
    let signature_id;
    let redirectToVerification2 = false;
    console.log("/getSignature");
    console.log("id: ", id);
    console.log("hashedId: ", hashedId);
    console.log("encryptedId: ", encryptedId);

    const accounts = [
      ["Information & Communications Technology: People 1", 10],
      ["Business & Management: People 1", 9],
      ["Hospitality Management: People 1", 11],
      ["Mr. Joseph Transmontero", 20],
      ["Mr. Mac Salonga",18],
      ["Ms. Anne Bartolome", 19],
    ];

    try {
      const query = `SELECT endorsed FROM inputted_table WHERE id = ${hashedId}`;
      db1.query(query, (error, results) => {
        if (error) {
          console.error(error);
          return res
            .status(500)
            .json({ error: "Error fetching endorsed value" });
        }
        if (results.length > 0) {
          const endorsedValue = results[0].endorsed;
          for (const account of accounts) {
            if (endorsedValue === account[0]) {
              signature_id = account[1];
              break;
            }
          }
          if (
            !signature_id &&
            (endorsedValue === null || endorsedValue === "N/A")
          ) {
            signature_id = defaultSignatureid;
          }
          console.log(signature_id);
        } else {
          console.log("No matching record found");
        }
      });

      const checkFormSignQuery =
        "SELECT form_sign FROM inputted_table WHERE id = ?";
      db1.query(checkFormSignQuery, [hashedId], async (error, result) => {
        if (error) {
          console.error("Error checking form_sign:", error);
          res.status(500).json({ error: "Error checking form_sign" });
        }

        const formSignValue = result[0] && result[0].form_sign;

        if (formSignValue) {
          alert("Already Signed");
          window.location.href = `/ejsrasaVanilla2/${encryptedId}`;
        }

        const updateQuery =
          "UPDATE inputted_table SET form_sign = (SELECT form_sign FROM signature_table2 WHERE id = ?) WHERE id = ?";
        const updateValues = [signature_id, hashedId];

        db1.query(updateQuery, updateValues, async (error, result) => {
          if (error) {
            console.error("Error updating form_sign:", error);
            return res.status(500).json({ error: "Error updating form_sign" });
          }

          console.log("form_sign updated successfully");
          const puppeteer = require("puppeteer");
          //const url = `http://localhost:3005/ejsrasaVanilla/${hashedId}`;
          const url = `http://154.41.254.18:3306/ejsrasaVanilla/${hashedId}`;

          try {
            const browser = await puppeteer.launch({
              headless: true,
              args: ["--no-sandbox"],
            });
            const page = await browser.newPage();
            await page.setViewport({ width: 941, height: 700 });
            await page.goto(url, { waitUntil: "load" });
            const pdfBuffer = await page.pdf();
            await browser.close();

            const updateSql =
              "UPDATE inputted_table SET rasa_status = ? WHERE id = ?";
            db1.query(
              updateSql,
              [
                "Step 3: First Signature Approved: sending email to miguelbaruc12@gmail.com",
                hashedId,
              ],
              (error, result) => {
                if (error) {
                  console.error(
                    "An error occurred while updating rasa_status:",
                    error
                  );
                  return res.status(500).json({
                    error: "An error occurred while updating rasa_status",
                  });
                } else {
                  console.log(
                    "rasa_status updated to First Signature Approved: waiting for approval of miguelbaruc12@gmail.com"
                  );
                  if (!redirectToVerification2) {
                    redirectToVerification2 = true;
                    res.redirect(`/verification2/${encryptedId}`);
                  }
                }

                const selectInventoryQuery =
                  "SELECT * FROM inventory_table WHERE id = ?";
                db1.query(
                  selectInventoryQuery,
                  [hashedId],
                  function (error, dataInventory) {
                    if (error) {
                      console.error("Error querying inventory_table:", error);
                      return res
                        .status(500)
                        .json({ error: "Error querying inventory_table" });
                    }

                    const selectInputtedQuery =
                      "SELECT * FROM inputted_table WHERE id = ?";
                    db1.query(
                      selectInputtedQuery,
                      [hashedId],
                      function (error, dataInputted) {
                        if (error) {
                          console.error(
                            "Error querying inputted_table:",
                            error
                          );
                          return res
                            .status(500)
                            .json({ error: "Error querying inputted_table" });
                        }

                        if (
                          dataInputted.length > 0 &&
                          dataInventory.length > 0
                        ) {
                          const datainputted = dataInputted[0];
                          const datainventory = dataInventory[0];
                          res.render("submitrasaCopy", {
                            inputted_table: datainputted,
                            inventory_table: datainventory,
                            universalId,
                          });
                        } else {
                          console.log(
                            "res.redirect(`/verification2/${hashedId}`)"
                          );
                        }
                      }
                    );
                  }
                );
              }
            );
          } catch (error) {
            console.error("An error occurred while generating PDF:", error);
            return res
              .status(500)
              .json({ error: "An error occurred while generating PDF" });
          }
        });
      });
    } catch (error) {
      console.error("An error occurred:", error);
      res.status(500).send("An error occurred while processing the request");
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("An error occurred while processing the request");
  }
});

router.get("/getSignature2/:hashedId", async (req, res) => {
  const crypto = require("crypto");
  const encryptionKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  function encryptId(id) {
    const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);
    let encryptedId = cipher.update(id.toString(), "utf8", "hex");
    encryptedId += cipher.final("hex");
    return encryptedId;
  }
  function decryptId(encryptedId) {
    const decipher = crypto.createDecipheriv("aes-256-cbc", encryptionKey, iv);
    let decryptedId = decipher.update(encryptedId, "hex", "utf8");
    decryptedId += decipher.final("utf8");
    return decryptedId;
  }
  const hashedId = req.params.hashedId;
  const decryptedrasaID = decryptId(hashedId);
  const universalId = req.session.universalId;
  //const hashedId = encryptId(decryptedrasaID);
  let redirectToVerification2 = false;
  console.log("----------------------------------------");
  console.log("/3 ");
  console.log("hashedId : ", hashedId);
  console.log("decryptedrasaID : ", decryptedrasaID);
  console.log("universalId : ", universalId);

  // Checking the form_sign2 column if it has values
  const checkFormSignQuery =
    "SELECT form_sign2 FROM inputted_table WHERE id = ?";
  db1.query(checkFormSignQuery, [decryptedrasaID], async (error, result) => {
    if (error) {
      console.error("Error checking form_sign:", error);
      res.status(500).json({ error: "Error checking form_sign" });
    }
    const formSignValue = result[0] && result[0].form_sign;
    if (formSignValue) {
      console.log("Already Signed");
      return res.status(200).send("Already Signed");
    }

    const updateQuery =
      "UPDATE inputted_table SET form_sign2 = (SELECT form_sign FROM signature_table2 WHERE id = 11) WHERE id = ?";

    db1.query(updateQuery, [decryptedrasaID], async (error, result) => {
      if (error) {
        console.error("Error updating form_sign:", error);
        return res.status(500).json({ error: "Error updating form_sign" });
      }

      console.log("form_sign updated successfully");
      const puppeteer = require("puppeteer");
     // const url = `http://localhost:3005/ejsrasaVanilla/${decryptedrasaID}`;
      const url = `http://154.41.254.18:3306/ejsrasaVanilla/${decryptedrasaID}`;

      try {
        const browser = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox"],
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 941, height: 700 });
        await page.goto(url, { waitUntil: "load" });
        const pdfBuffer = await page.pdf();
        await browser.close();

        const updateSql =
          "UPDATE inputted_table SET rasa_status = ? WHERE id = ?";
        db1.query(
          updateSql,
          [
            "Step 6: 2/2 Signature: sending email to @gmail.com",
            decryptedrasaID,
          ],
          (error, result) => {
            if (error) {
              console.error(
                "An error occurred while updating rasa_status:",
                error
              );
              return res.status(500).json({
                error: "An error occurred while updating rasa_status",
              });
            } else {
              console.log(
                "rasa_status updated to Step 6: 2/2 Signature: sending email to @gmail.com"
              );

              if (!redirectToVerification2) {
                redirectToVerification2 = true;
                res.redirect(`/verification2/${hashedId}`);
              } //Root123!
            }

            const selectInventoryQuery =
              "SELECT * FROM inventory_table WHERE id = ?";
            db1.query(
              selectInventoryQuery,
              [decryptedrasaID],
              function (error, dataInventory) {
                if (error) {
                  console.error("Error querying inventory_table:", error);
                  return res
                    .status(500)
                    .json({ error: "Error querying inventory_table" });
                }

                const selectInputtedQuery =
                  "SELECT * FROM inputted_table WHERE id = ?";
                db1.query(
                  selectInputtedQuery,
                  [decryptedrasaID],
                  function (error, dataInputted) {
                    if (error) {
                      console.error("Error querying inputted_table:", error);
                      return res
                        .status(500)
                        .json({ error: "Error querying inputted_table" });
                    }

                    if (dataInputted.length > 0 && dataInventory.length > 0) {
                      const datainputted = dataInputted[0];
                      const datainventory = dataInventory[0];
                      res.locals.rasaID = decryptedrasaID;
                      res.render("submitrasaCopy", {
                        inputted_table: datainputted,
                        inventory_table: datainventory,
                        universalId,
                      });
                    } else {
                      console.log(
                        "res.redirect(`/ejsrasaVanilla2/${hashedId}`)"
                      );
                    }
                  }
                );
              }
            );
          }
        );
      } catch (error) {
        console.error("An error occurred while generating PDF:", error);
        return res
          .status(500)
          .json({ error: "An error occurred while generating PDF" });
      }
    });
  });
});

/*
// New getsignature2 route for demo
router.get("/getSignature2/:hashedId", async (req, res) => {
  const hashedId = req.params.hashedId;
  let redirectToVerification2 = false;
  console.log("----------------------------------------");
  console.log("/3 ");
  console.log("hashedId : ", hashedId);

  // Checking the form_sign2 column if it has values
  const checkFormSignQuery =
    "SELECT form_sign2 FROM inputted_table WHERE id = ?";
  db1.query(checkFormSignQuery, [hashedId], async (error, result) => {
    if (error) {
      console.error("Error checking form_sign:", error);
      res.status(500).json({ error: "Error checking form_sign" });
    }
    const formSignValue = result[0] && result[0].form_sign;
    if (formSignValue) {
      console.log("Already Signed");
      return res.status(200).send("Already Signed");
    }

    const updateQuery =
      "UPDATE inputted_table SET form_sign2 = (SELECT form_sign FROM signature_table2 WHERE id = 11) WHERE id = ?";

    db1.query(updateQuery, [hashedId], async (error, result) => {
      if (error) {
        console.error("Error updating form_sign:", error);
        return res.status(500).json({ error: "Error updating form_sign" });
      }

      console.log("form_sign updated successfully");
      const puppeteer = require("puppeteer");
      const url = `http://localhost:3005/ejsrasaVanilla/${hashedId}`;
      //const url = `http://154.41.254.18:3306/ejsrasaVanilla/${hashedId}`;

      try {
        const browser = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox"],
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 941, height: 700 }); // Adjust the width and height as needed
        await page.goto(url, { waitUntil: "load" });
        const pdfBuffer = await page.pdf();
        await browser.close();

        const updateSql =
          "UPDATE inputted_table SET rasa_status = ? WHERE id = ?";
        db1.query(
          updateSql,
          ["Step 6: 2/2 Signature: sending email to @gmail.com", hashedId],
          (error, result) => {
            if (error) {
              console.error(
                "An error occurred while updating rasa_status:",
                error
              );
              return res.status(500).json({
                error: "An error occurred while updating rasa_status",
              });
            } else {
              console.log(
                "rasa_status updated to Step 6: 2/2 Signature: sending email to @gmail.com"
              );
              /*
            if (!redirectToVerification2) {
              redirectToVerification2 = true;
              res.redirect(`/verification2/${hashedId}`);
            } Root123!
            }

            const selectInventoryQuery =
              "SELECT * FROM inventory_table WHERE id = ?";
            db1.query(
              selectInventoryQuery,
              [hashedId],
              function (error, dataInventory) {
                if (error) {
                  console.error("Error querying inventory_table:", error);
                  return res
                    .status(500)
                    .json({ error: "Error querying inventory_table" });
                }

                const selectInputtedQuery =
                  "SELECT * FROM inputted_table WHERE id = ?";
                db1.query(
                  selectInputtedQuery,
                  [hashedId],
                  function (error, dataInputted) {
                    if (error) {
                      console.error("Error querying inputted_table:", error);
                      return res
                        .status(500)
                        .json({ error: "Error querying inputted_table" });
                    }

                    if (dataInputted.length > 0 && dataInventory.length > 0) {
                      const datainputted = dataInputted[0];
                      const datainventory = dataInventory[0];
                      res.locals.rasaID = hashedId;
                      res.render("submitrasaCopy", {
                        inputted_table: datainputted,
                        inventory_table: datainventory,
                        universalId,
                      });
                    } else {
                      res.redirect(`/ejsrasaVanilla2/${hashedId}`);
                    }
                  }
                );
              }
            );
          }
        );
      } catch (error) {
        console.error("An error occurred while generating PDF:", error);
        return res
          .status(500)
          .json({ error: "An error occurred while generating PDF" });
      }
    });
  });
});
*/

router.get("/api/calendarFinal", (req, res) => {
  const query =
    "SELECT * FROM calendar_input WHERE id = ? AND event_day = ? AND event_name = ? AND event_description = ? AND required_day = ?";
  const params = [id, event_day, event_name, event_description, required_day];

  db1.query(query, params, (error, results) => {
    if (error) {
      console.error("Error fetching data from the database:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    res.json(results);
  });
});

router.get("/api/calendarInputData", (req, res) => {
  const query = "SELECT * FROM calendar_input";
  db1.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching data from the database:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    res.json(results);
  });
});

/*
router.get("/insertSign", async (req, res) => {
  res.sendFile("insertSign.html", { root: "./public/" });
});
*/

router.get("/logout", logout);
router.get("/newreg", newreg);

app.listen(PORT1);
module.exports = router;
