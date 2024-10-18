const NoticeBoard = require("../models/NoticeBoard");
const notifyModel = require("../models/Notifications");

 exports.createNotice = async(req,res) => {
    try {
        const {societyId, sender, subject, description, date} = req.body;
        const notice = new NoticeBoard ({
            societyId, sender, subject, description, date
        });
        await notice.save();
        if (notice) {
            const notifyData = new notifyModel({
                Category: "Notice",
                societyId: societyId,
                SenderName: sender,
            })
            await notifyData.save()
        }
        return res.status(201).json({success:true, message: "Successfully Created!!!"})
    } catch (error) {
        return res.status(401).json({success:false, message: "Error:", error})
    }
 }

 exports.getNotice = async(req, res) => {
    const {societyId} = req.params;
    console.log(societyId)
    try {
        const notices = await NoticeBoard.find({societyId}).sort({createdAt : -1});
        console.log(notices)
        return res.status(201).json({success: true, notices});
    } catch (error) {
        return res.status(401).json({success: false, error}); 
    }
 }

 exports.getAllNotice = async(req, res) => {
    const {societyId} = req.params;
    try {
        const notices = await NoticeBoard.find({societyId});
        return res.status(201).json({success: true, notices});
    } catch (error) {
        return res.status(401).json({success: false, error}); 
    }
 }

 exports.getNoticeById = async(req, res) => {
    const {id} = req.params;
    try {
        const notices = await NoticeBoard.findById(id);
        if(!notices){
            return res.status(401).json({success: false, message: "No Notice Found"});   
        }
        return res.status(201).json({success: true, notices});
    } catch (error) {
        return res.status(404).json({success: false, error}); 
    }
 }

 exports.editNotice = async(req, res) => {
    try {
        const {id} = req.params;
        const updateField = { ...req.body };
      
        const notice = await NoticeBoard.findById(id);
        if(!notice){
            return res.status(301).json({success:false, message:"No Match Found"});
        }
        const newNotice = await NoticeBoard.findByIdAndUpdate(id, {$set: updateField}, {new: true});
        return res.status(201).json({success: true, message: "Successfully Updated", newNotice})
    
    } catch (error) {
        return res.status(401).json({success: false, message: "Error in Updating", error})
    
    }
 }

 exports.deleteNotice = async(req,res) =>{
    try {
        const {id} = req.params;
        const notice = await NoticeBoard.findById(id);

        if(!notice){
            return res.status(301).json({success: false, message:"No Match Found"});
        }
        await NoticeBoard.findByIdAndDelete(id);
        return res.status(201).json({success: true, message: "Successfully Deleted"});
        
    } catch (error) {
        return res.status(401).json({success: false, error});
    }
 }
