const express = require('express');
const { societySignup, societyVerifyCodeAndResetPassword,
    societyForgotPassword, societySignout, societySignin,
    updateSocietyAdminProfile,
    getSocietiesByCityId, 
    getSocietyById,
    getAllSocieties,
    renewSocietyPlan,
    societyResetPassword,
    getSocietyByLicenceId,
    profile} = require('../../controllers/Authentication/SocietyAdmin');
const router = express.Router();

router.post('/society/signup', societySignup);
router.post('/society/signin', societySignin);
router.post('/society/signout', societySignout);
router.post('/society/forgotPassword', societyForgotPassword);
router.post('/society/verifyCodeAndResetPassword', societyVerifyCodeAndResetPassword);
router.put('/society/Update/:id',  updateSocietyAdminProfile);
router.get('/society/profile/:societyId',  profile);

router.get('/society/:cityId', getSocietiesByCityId);
router.get('/societyDetails/:societyId', getSocietyById);
router.get('/society', getAllSocieties);
router.put('/society/renewal',  renewSocietyPlan);
router.post('/society/resetPassword',  societyResetPassword);



router.get('/society/getSocietyByLicenceId/:licenseId', getSocietyByLicenceId);
module.exports = router;