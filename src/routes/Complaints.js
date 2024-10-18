const express = require('express');
const router = express.Router();
const { createComplaint, getAllComplaintsBySocietyId, getComplaintBySocietyId, 
    updateComplaint, deleteComplaint,updateComplaintStatus } = require('../controllers/Complaints');

// Routes for complaints
router.post('/createComplaint', createComplaint);
router.get('/getAllComplaints/:societyId', getAllComplaintsBySocietyId);
router.get('/getComplaintBySocietyId/:societyId/:complaintId', getComplaintBySocietyId);
router.put('/updateComplaint/:societyId/:complaintId', updateComplaint);
router.delete('/deleteComplaint/:societyId/:complaintId', deleteComplaint);
router.put('/updateComplaintStatus/:societyId/:complaintId', updateComplaintStatus);

module.exports = router;
