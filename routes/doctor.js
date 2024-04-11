const { Router } = require("express");
const doctorMiddleware = require("../middleware/doctor");
const { Doctor, Patient, Slot } = require("../db");
const  JWT_SECRET  = "ankit"
const router = Router();
const jwt = require("jsonwebtoken");

// Doctor Routes
router.post('/signup', async (req, res) => {
    // Implement doctor signup logic
    const { username, password, specialty } = req.body;

    // Check if a doctor with this username already exists
    const existingDoctor = await Doctor.findOne({ username });

    if (existingDoctor) {
        return res.status(400).json({
            message: 'Doctor with this username already exists'
        });
    }

    // Check if the specialty is one of the allowed values
    const allowedSpecialties = ['Cardiologist', 'Dermatologist', 'Orthopedic', 'General Physician'];
    if (!allowedSpecialties.includes(specialty)) {
        return res.status(400).json({
            message: 'Invalid specialty. Allowed values are Cardiologist, Dermatologist, Orthopedic, General Physician'
        });
    }

    // Create the doctor with the provided username, password, and specialty
    await Doctor.create({
        username,
        password,
        specialty
    });

    res.json({
        message: `Hello, ${username}, you registered successfully with specialty ${specialty}`
    });
});

router.post('/signin', async (req, res) => {
    // Implement doctor signin logic
    const username = req.body.username;
    const password = req.body.password;

    const doctor = await Doctor.findOne({
        username,
        password
    });

    if (doctor) {
        const token = jwt.sign({
            username
        }, JWT_SECRET);

        res.json({
            message:`Welcome ${username}`
            ,token
        })
    } else {
        res.status(411).json({
            message: "Incorrect email and password"
        })
    }
});


router.post('/slots', doctorMiddleware, async (req, res) => {
    const { name, speciality, slotTiming } = req.body;

    // Parse slotTiming input to get start and end times
    //input in this format - 9:00-10:30
    const [startTime, endTime] = slotTiming.split('-');
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Calculate the duration of the slot in minutes
    const slotDuration = (endHour - startHour) * 60 + (endMinute - startMinute);

    if (slotDuration <= 60) {
        // Slot duration is within the allowed limit
        const newSlot = await Slot.create({
            name,
            speciality,
            slotTiming
        });

        res.json({
            message: 'Slot created successfully',
            slotId: newSlot._id
        });
    } else {
        // Slot duration exceeds 60 minutes
        res.status(400).json({
            message: `Sorry Dr. ${name}, slots are 60 mins only`
        });
    }
});


router.get('/slots', doctorMiddleware, async (req, res) => {
    // Implement fetching all slots logic
    const response = await Slot.find({});

    res.json({
        slots: response
    });
});

module.exports = router;
