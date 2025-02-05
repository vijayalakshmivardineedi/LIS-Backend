
const express = require('express');
const { createDocuments, getDocumentsBySocietyId, getDocumentsById, editDocuments, deleteDocuments, getDocumentsBySocietyBlockFlat } = require('../controllers/Documents');
const router = express.Router();

router.post('/createDocuments', createDocuments);
router.get('/getDocumentsBySocietyId/:societyId', getDocumentsBySocietyId);
router.get('/documents/:societyId/:blockNumber/:flatNumber', getDocumentsBySocietyBlockFlat);
router.get('/getDocumentsById/:id', getDocumentsById);
router.put('/editDocuments/:id', editDocuments);
router.delete('/deleteDocuments/:id', deleteDocuments);

module.exports = router;
