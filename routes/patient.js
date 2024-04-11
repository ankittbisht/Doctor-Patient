const { Router } = require("express");
const router = Router();
const patientMiddleware = require("../middleware/patient");
const { Doctor, Patient, Slot } = require("../db");
const JWT_SECRET = "ankit";
const jwt = require("jsonwebtoken");

// Patient Routes
router.post("/signup", (req, res) => {
  // Implement patient signup logic
  const { username, password } = req.body;
  const patient = new Patient({
    username: username,
    password: password,
  });
  patient.save();
  res.json({
    msg: "Patient Created Successfully",
  });
});

router.post("/signin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const patient = await Patient.findOne({
    username,
    password,
  });
  if (patient) {
    const token = jwt.sign(
      {
        username,
      },
      JWT_SECRET
    );

    res.json({
      token,
    });
  } else {
    res.status(411).json({
      message: "Incorrect Email and password",
    });
  }
});

//all Available slots
router.get("/slots", async (req, res) => {
  try {
    // Implement listing slots with specific fields logic
    const response = await Slot.find({}, "name speciality slotTiming _id");

    res.json({
      slots: response,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// router.post("/slots/:slotId", patientMiddleware, async (req, res) => {
//   // Implement slot booking logic
//   const slotId = req.params.slotId;
//   const username = req.username;

//   // Update the Patient document to add the booked slot
//   await Patient.updateOne(
//     {
//       username
//     },
//     {
//       $push: {
//         bookedSlots: slotId,
//       },
//     }
//   );

//   // Remove the booked slot from the Slot document
//   await Slot.deleteOne({ _id: slotId });

//   res.json({
//     message: `Dear ${username}, your Slot with id ${slotId} booked successfully!`,
//   });
// });


router.post("/slots/:slotId", patientMiddleware, async (req, res) => {
    try {
        const slotId = req.params.slotId;
        const username = req.username;

        // Check if the patient has already booked the selected slot
        const patient = await Patient.findOne({ username });
        if (patient.bookedSlots.includes(slotId)) {
            return res.status(400).json({ message: 'You have already booked this slot' });
        }

        // Get the slot information
        const slot = await Slot.findById(slotId);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        // Check if the slot overlaps with any existing booked slots of the patient
        const overlappingAppointment = patient.bookedSlots.find(async bookedSlotId => {
            const bookedSlot = await Slot.findById(bookedSlotId);
            return areTimeSlotsOverlapping(slot.slotTiming, bookedSlot.slotTiming);
        });

        if (overlappingAppointment) {
            return res.status(400).json({ message: 'You already have an appointment booked in this time slot' });
        }

        // Update the patient's bookedSlots array with the new slotId
        await Patient.updateOne(
            { username },
            { $push: { bookedSlots: slotId } }
        );

        res.json({ message: `Dear ${username}, your slot with id ${slotId} has been booked successfully!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Function to check if two time slots overlap
function areTimeSlotsOverlapping(slot1Timing, slot2Timing) {
    const [start1, end1] = slot1Timing.split('-').map(time => new Date(`2000-01-01T${time}:00`));
    const [start2, end2] = slot2Timing.split('-').map(time => new Date(`2000-01-01T${time}:00`));
    return (start1 < end2 && end1 > start2);
}



//Slots with doctor Speciality
router.get("/speciality", async (req, res) => {
  // Implement listing slots by specialty logic
  const { speciality } = req.body;

  if (!speciality) {
    return res.status(400).json({
      message: "Speciality parameter is required in the request body",
    });
  }

  // Find slots matching the provided specialty
  const slots = await Slot.find({ speciality });

  // Format the response
  const formattedSlots = slots.map((slot) => ({
    doctor: slot.name,
    timing: slot.slotTiming,
    id:slot._id
  }));

  res.json({
    slots: formattedSlots,
  });
});

//showing booked slots
router.get("/bookedSlots", patientMiddleware, async (req, res) => {
  // Implement fetching booked slots logic
  const patient = await Patient.findOne({
    username: req.username,
  });

  const slots = await Slot.find({
    _id: {
      $in: patient.bookedSlots,
    },
  });
  res.json({
    slots: slots,
  });
});

router.delete("/cancel-booking/:cancelBookingId", async (req, res) => {
  try {
    const { cancelBookingId } = req.params;

    // Find the booking in the database
    const patient = await Patient.findOne({ bookedSlots: cancelBookingId });

    // Check if the booking exists
    if (!Patient) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Remove the cancelled slot ID from the bookedSlots array
    const updatedBookedSlots = patient.bookedSlots.filter(
      (slotId) => slotId.toString() !== cancelBookingId
    );

    // Update the patient document with the new bookedSlots array
    await Patient.findByIdAndUpdate(patient._id, {
      bookedSlots: updatedBookedSlots,
    });

    res.json({ message: `Appointment Cancelled with id ${cancelBookingId}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
