const db1 = require("../routes/rasa-db");

const editUserView = async (req, res) => {
  const {email, password, role} = req.body;

  if (!role || !email || !password) {
    return res.json({
      status: "error",
      error: "Please provide the email, password, and role",
    });
  }

  db1.query(
    "SELECT id FROM user WHERE email = ?",
    [email],
    (error, results) => {
      if (error) throw error;

      if (results.length === 0) {
        return res.json({
          status: "error",
          error: "User not found",
        });
      }

      const userId = results[0].id;

      db1.query(
        "UPDATE user SET email = ?, password = ?, role = ? WHERE id = ?",
        [email, password, role, userId],
        (error, results) => {
          if (error) throw error;
          console.log(`Email: ${email}, Password: ${password}, Role: ${role}, UserID: ${userId} updated successfully`);
          return res.json({
            status: "success",
            success: "User data updated successfully",
          });
        }
      );
    }
    

    
  );
  
};

module.exports = editUserView;