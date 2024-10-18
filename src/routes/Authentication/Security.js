
const express = require('express');
const { createSequrity, updateSequrityProfile, getSequritiesBySocietyId, deleteSequrityProfilePicture, getGuardBySocietyIdAndId, sequirtySignin, getSequrityBySocietyIdAndsequrityId, getAttendanceOfSequrityId, addCheckIn, addCheckOut, } = require('../../controllers/Authentication/Security');
const router = express.Router();


router.post('/sequrity/createSequrity', createSequrity);
router.post('/sequrity/sequirtySignin', sequirtySignin);
router.get('/sequrity/getSequrityBySocietyId/:societyId', getSequritiesBySocietyId);
router.put('/sequrity/updateSequrityById/:sequrityId', updateSequrityProfile);
router.delete('/sequrity/deleteSequrity/:id', deleteSequrityProfilePicture);
router.get('/sequrity/getSequrityPerson/:societyId/:sequrityId', getSequrityBySocietyIdAndsequrityId);
router.get('/sequrity/getAttendanceOfId/:societyId/:sequrityId', getAttendanceOfSequrityId);

router.put('/sequrity/addCheckIn/:sequrityId', addCheckIn);
router.put('/sequrity/addCheckOut/:sequrityId/:attendanceId', addCheckOut);

router.get('/sequrity/getGuardBySocietyIdAndId/:societyId/:sequrityId', getGuardBySocietyIdAndId);


module.exports = router;