const VisitorStaff = require("../models/VisitorsServices");
const Services = require("../models/Services");
const { default: mongoose } = require("mongoose");

exports.checkInStaff = async (req, res) => {
  try {
    const { societyId, userid, inGateNumber, inVehicleNumber } = req.body;
    const serviceTypes = [
      "maid",
      "milkMan",
      "cook",
      "paperBoy",
      "driver",
      "water",
      "plumber",
      "carpenter",
      "electrician",
      "painter",
      "moving",
      "mechanic",
      "appliance",
      "pestClean",
    ];


    const existingCheckIn = await VisitorStaff.findOne({
      "society.societyId": societyId,
      "society.staff": {
        $elemMatch: {
          userId: userid,
          checkOutDateTime: { $exists: false },
        },
      },
    });

    console.log("existingCheckIn:", existingCheckIn);

    if (existingCheckIn) {
      return res.status(400).json({
        success: false,
        message:
          "User is already checked in and must check out before checking in again",
      });
    }

    let checkInRecord;
    for (let serviceType of serviceTypes) {
      const serviceProvider = await Services.findOne(
        {
          "society.societyId": societyId,
          [`society.${serviceType}.userid`]: userid,
        },
        { [`society.${serviceType}.$`]: 1 }
      ); // Fetch only the matching subdocument

      if (serviceProvider) {
        // Extract the name from the matching service type
        const userDetail = serviceProvider.society[serviceType].find(
          (service) => service.userid === userid
        );
        const userName = userDetail ? userDetail.name : null;

        // Prepare check-in record
        checkInRecord = {
          serviceType, // Save the service type
          userId: userid,
          name: userName, // Add the name to the check-in record
          inGateNumber,
          inVehicleNumber,
          serviceProvider: serviceProvider._id, // Save the serviceProvider._id
          checkInDateTime: new Date(), // Add a check-in timestamp
        };

        // Update the visitor staff collection
        await VisitorStaff.findOneAndUpdate(
          { "society.societyId": societyId },
          { $push: { "society.staff": checkInRecord } },
          { new: true, upsert: true }
        );

        break; // Exit loop once a match is found
      }
    }

    if (!checkInRecord) {
      return res.status(404).json({
        success: false,
        message: "UserId not found or invalid for any service type",
      });
    }

    res.status(200).json({
      success: true,
      message: "Staff checked in successfully",
      checkInRecord,
    });
  } catch (error) {
    console.error("Error checking in staff:", error);
    res.status(500).json({
      success: false,
      message: "Error checking in staff",
      error: error.message,
    });
  }
};

exports.checkOutStaff = async (req, res) => {
  try {
    const { societyId,  id, outGateNumber, outVehicleNumber } = req.body;
    const visitorStaff = await VisitorStaff.findOne({
      "society.societyId": societyId,
    });

    if (!visitorStaff) {
      return res.status(404).json({
        success: false,
        message: "Society not found or no staff records",
      });
    }

    const staffIndex = visitorStaff.society.staff.findIndex((staff) => {
      const staffId =
        staff._id instanceof mongoose.Types.ObjectId
          ? staff._id
          : new mongoose.Types.ObjectId(staff._id);

      const comparisonId = new mongoose.Types.ObjectId(id);
      return staffId.equals(comparisonId);
    });
    if (staffIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found or already checked out",
      });
    }

    visitorStaff.society.staff[staffIndex].checkOutDateTime = new Date();
    visitorStaff.society.staff[staffIndex].outGateNumber = outGateNumber;
    visitorStaff.society.staff[staffIndex].outVehicleNumber = outVehicleNumber;

    await visitorStaff.save();

    res
      .status(200)
      .json({ success: true, message: "Staff checked out successfully" });
  } catch (error) {
    console.error("Error checking out staff:", error);
    res.status(500).json({
      success: false,
      message: "Error checking out staff",
      error: error.message,
    });
  }
};

exports.getAllStaffRecords = async (req, res) => {
  try {
    const { societyId } = req.params;

    const visitorStaff = await VisitorStaff.findOne({
      "society.societyId": societyId,
    });

    if (!visitorStaff) {
      return res.status(404).json({
        success: false,
        message: "Society not found or no staff records",
      });
    }

    res
      .status(200)
      .json({ success: true, staffRecords: visitorStaff.society.staff });
  } catch (error) {
    console.error("Error fetching staff records:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching staff records",
      error: error.message,
    });
  }
};
exports.getAllVisitorsStaffBySocietyId = async (req, res) => {
  try {
    const { societyId } = req.params;
    const society = await VisitorStaff.findOne({
      "society.societyId": societyId,
    });

    if (!society) {
      return res
        .status(404)
        .json({ success: false, message: "Society not found" });
    }

    res.status(200).json({ success: true, staff: society.society.staff });
  } catch (error) {
    console.log("Error in getting all staff by societyId:", error);
    res
      .status(500)
      .json({ success: false, message: "An error occurred in getting staff" });
  }
};

exports.getVisitorsStaffByIdAndSocietyId = async (req, res) => {
  try {
    const { societyId, userId } = req.params;
    const society = await VisitorStaff.findOne({
      "society.societyId": societyId,
      "society.staff.userId": userId,
    });

    if (!society) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });
    }

    const staff = society.society.staff.find((v) => v.userId === userId);
    return res.status(200).json({ success: true, staff });
  } catch (error) {
    console.error("Error in getting staff by id and societyId:", error);

    res
      .status(500)
      .json({ success: false, message: "An error occurred in getting staff" });
  }
};
