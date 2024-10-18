const express = require('express');
const { createNotice, getNotice, editNotice, deleteNotice, getAllNotice, getNoticeById } = require('../controllers/NoticeBoard');
const router =express.Router();

router.post('/createNotice', createNotice);
router.get('/getNotice/:societyId', getNotice);
router.get('/getAllNotice/:societyId', getAllNotice);
router.get('/getNoticeById/:id', getNoticeById);
router.put('/editNotice/:id', editNotice);
router.delete('/deleteNotice/:id', deleteNotice);

module.exports = router;
