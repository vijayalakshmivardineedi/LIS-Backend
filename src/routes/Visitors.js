
const express = require('express');
const { createVisitors, checkoutVisitor, getAllVisitorsBySocietyId, getVisitorsBySocietyIdLast24Hours, getVisitorByIdAndSocietyId,
       checkInVisitor, getFrequentVisitors, deleteFrequentVisitors,
       getPreApprovedVisitors, getAllVisitorsbyFlatNo, userAccess, denyVisitor, deleteEntryVisit } = require('../controllers/Visitors');
const router = express.Router();

router.post('/createVisitors', createVisitors);
router.put('/checkInVisitor', checkInVisitor);
router.put('/checkoutVisitor', checkoutVisitor);
router.put('/userAccess', userAccess);
router.put('/denyVisitor', denyVisitor);
router.get('/getAllVisitorsBySocietyId/:societyId', getAllVisitorsBySocietyId);
router.get('/getVisitorByIdAndSocietyId/:societyId/:visitorId', getVisitorByIdAndSocietyId);
router.get('/getVisitorsBySocietyIdLast24Hours/:societyId', getVisitorsBySocietyIdLast24Hours)

router.get('/getFrequentVisitors/:societyId/:block/:flatNo', getFrequentVisitors);
router.get('/getPreApprovedVisitors/:societyId/:block/:flatNo', getPreApprovedVisitors);
router.get('/getAllVisitorsbyFlatNo/:societyId/:block/:flatNo', getAllVisitorsbyFlatNo);
router.delete('/deleteFrequentVisitor/:societyId/:block/:flatNo/:visitorId', deleteFrequentVisitors);
router.delete('/deleteEntryVisitor/:societyId/:block/:flatNo/:visitorId', deleteEntryVisit);

module.exports = router;
