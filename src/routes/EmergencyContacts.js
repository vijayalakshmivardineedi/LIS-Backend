const express = require("express");
const router = express.Router();
const {
  createEmergencyContact,
  getAllEmergencyContacts,
  updateEmergencyContact,
  deleteEmergencyContact,
  getEmergencyContactBySocietyId,
} = require("../controllers/EmergencyContacts");


router.post("/createEmergencyContact", createEmergencyContact);


router.get("/getAllEmergencyContacts", getAllEmergencyContacts);
router.get("/getEmergencyContactBySocietyId/:societyid", getEmergencyContactBySocietyId);

router.put("/updateEmergencyContact/:id", updateEmergencyContact);


router.delete("/deleteEmergencyContact/:id", deleteEmergencyContact);

module.exports = router;