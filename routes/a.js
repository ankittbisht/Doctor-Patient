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
