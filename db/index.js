const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb+srv://ab67743:vDviWRHjnBL1IWdd@cluster0.lrdyhzc.mongodb.net/doctor");

const DoctorSchema = new mongoose.Schema({
  username: String,
  password: String,
  specialty: {
      type: String,
      enum: ['Cardiologist', 'Dermatologist', 'Orthopedic', 'General Physician']
  }
});


const PatientSchema = new mongoose.Schema({
  // Schema definition here
  username: String,
  password: String,
  bookedSlots: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
    },
  ],
});

const SlotSchema = new mongoose.Schema({
  name: String,
  speciality: String,
  slotTiming: String, 
});

const Doctor = mongoose.model("Doctor", DoctorSchema);
const Patient = mongoose.model("Patient", PatientSchema);
const Slot = mongoose.model("Slot", SlotSchema);

module.exports = {
  Doctor,
  Patient,
  Slot,
};
