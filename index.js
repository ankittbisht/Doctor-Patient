const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const doctorRouter = require("./routes/doctor")
const patientRouter = require("./routes/patient");

// Middleware for parsing request bodies
app.use(bodyParser.json());
app.use("/doctor", doctorRouter)
app.use("/patient", patientRouter)

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

