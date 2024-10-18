
const express = require('express');
const { checkInStaff, checkOutStaff,  getVisitorsStaffByIdAndSocietyId, getAllStaffRecords } = require('../controllers/VisitorServices');
const router = express.Router();

router.post('/checkInStaff', checkInStaff);
router.put('/checkOutStaff', checkOutStaff);
router.get('/getVisitorsStaffByIdAndSocietyId/:societyId/:userId', getVisitorsStaffByIdAndSocietyId);

router.get('/getAllStaffRecords/:societyId', getAllStaffRecords);
module.exports = router;
