
const express = require('express');
const multer = require('multer');
const db1 = require("../routes/rasa-db");
const sharp = require('sharp');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([{ name: 'form_sign' }]);

router.post('/insertSign', upload, (req, res) => {
    const { form_sign } = req.files;

    // Access the file buffers
    const form_signBuffer = form_sign[0].buffer;

    // Use Sharp to resize the image
    sharp(form_signBuffer)
        .resize(200, 130)
        .toBuffer()
        .then((scaledBuffer) => {
            // Save the scaled image buffers to the database
            db1.query('INSERT INTO signature_table2 (form_sign) VALUES (?)', [scaledBuffer], (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ error: "Error inserting signatures" });
                } else {
                    console.log("Signatures are successfully inserted");
                    return res.json({
                        status: "success",
                        success: "Signatures are successfully inserted"
                    });
                }
            });
        })
        .catch((error) => {
            console.error(error);
            return res.status(500).json({ error: "Error resizing and inserting signatures" });
        });
});

module.exports = router;
