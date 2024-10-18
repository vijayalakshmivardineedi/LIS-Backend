const multer = require("multer");
const path = require("path");
const fs = require("fs");
const shortid = require("shortid");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const Visitor = require("../models/Visitors");

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destinationPath = path.join(__dirname, "../Uploads/VisitorsPictures");
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }
    cb(null, destinationPath);
  },
  filename: function (req, file, cb) {
    cb(null, shortid.generate() + "-" + file.originalname);
  },
});

const generatedUserIdCodes = new Set();

// Function to generate unique user ID code
const generateUserIdCode = () => {
  let userIdCode;
  do {
    userIdCode = "";
    for (let i = 0; i < 6; i++) {
      userIdCode += Math.floor(Math.random() * 10);
    }
  } while (generatedUserIdCodes.has(userIdCode));
  generatedUserIdCodes.add(userIdCode);
  return userIdCode;
};

const upload = multer({ storage }).fields([
  { name: "pictures", maxCount: 1 },
  { name: "qrImage", maxCount: 1 },
]);

exports.createVisitors = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "An error occurred in uploading files",
        });
      }
      try {
        const {
          societyId,
          name,
          phoneNumber,
          block,
          flatNo,
          role,
          reason,
          details,
          inGateNumber,
          status,
          inVehicleNumber,
          company,
          date,
          userAccess,
        } = req.body;
        let { checkInDateTime } = req.body;

        if (checkInDateTime === "1") {
          checkInDateTime = Date.now();
        }

        let pictures = "";
        if (
          req.files &&
          req.files["pictures"] &&
          req.files["pictures"].length > 0
        ) {
          pictures = `/publicVisitorsPictures/${req.files["pictures"][0].filename}`;
        }

        const visitorId = generateUserIdCode();
        const newVisitor = {
          visitorId,
          name,
          date,
          phoneNumber,
          block,
          flatNo,
          role,
          checkInDateTime,
          inGateNumber,
          status,
          userAccess,
          reason,
          inVehicleNumber,
          details,
          company,
          pictures,
          qrImage: null,
        };

        let savedVisitor;

        // Check if society exists
        const existingSociety = await Visitor.findOne({
          "society.societyId": societyId,
        });

        if (existingSociety) {
          // Add new visitor to existing society
          savedVisitor = await Visitor.findOneAndUpdate(
            { "society.societyId": societyId },
            { $push: { "society.visitors": newVisitor } },
            { new: true }
          );
        } else {
          // Create a new society with the visitor
          const newSociety = new Visitor({
            society: {
              societyId,
              visitors: [newVisitor],
            },
          });
          savedVisitor = await newSociety.save();
        }

        // Generate QR Code
        const qrCodeFileName = uuidv4() + ".png";
        const qrCodeDir = path.join(__dirname, "../Uploads/VisitorsPictures"); // Save QR code in VisitorsPictures directory
        const qrCodeFilePath = path.join(qrCodeDir, qrCodeFileName);

        if (!fs.existsSync(qrCodeDir)) {
          fs.mkdirSync(qrCodeDir, { recursive: true });
        }

        await QRCode.toFile(qrCodeFilePath, visitorId);

        const qrCodeUrl = `/publicQRVisitorsPictures/${qrCodeFileName}`;

        await Visitor.findOneAndUpdate(
          {
            "society.societyId": societyId,
            "society.visitors.visitorId": visitorId,
          },
          { $set: { "society.visitors.$.qrImage": qrCodeUrl } }
        );

        res.status(201).json({
          success: true,
          message: "Visitor created successfully",
          data: { savedVisitor, qrCodeUrl },
        });
      } catch (error) {
        console.log("Error in creating visitor:", error);
        res.status(500).json({
          success: false,
          message: "An error occurred in creating visitor",
        });
      }
    });
  } catch (error) {
    console.log("Error in createVisitor controller:", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

exports.checkoutVisitor = async (req, res) => {
  try {
    const { societyId, visitorId, id, outVehicleNumber, outGateNumber } =
      req.body;
    // Retrieve the visitor
    const visitorRecord = await Visitor.findOne(
      {
        "society.societyId": societyId,
        "society.visitors._id": id,
      },
      { "society.visitors.$": 1 }
    );
    if (!visitorRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }
    const visitor = visitorRecord.society.visitors[0];
    // Check if visitor is already checked out
    if (visitor.checkOutDateTime) {
      return res
        .status(400)
        .json({ success: false, message: "Visitor is already checked out" });
    }
    // Retrieve the current qrImage URL
    const qrImageUrl = visitor.qrImage;
    if (qrImageUrl) {
      // Extract the file name from the URL
      const qrImageFileName = path.basename(qrImageUrl);
      const qrImagePath = path.join(
        __dirname,
        "../Uploads/VisitorsPictures",
        qrImageFileName
      );
      // Delete the QR image file
      fs.unlink(qrImagePath, (err) => {
        if (err) {
          console.log("Error in deleting QR image file:", err);
        } else {
          console.log("QR image file deleted successfully");
        }
      });
    }
    // Update the visitor's status, checkOutDateTime, and qrImage
    const updatedVisitor = await Visitor.findOneAndUpdate(
      { "society.societyId": societyId, "society.visitors._id": id },
      {
        $set: {
          "society.visitors.$.status": "Check Out",
          "society.visitors.$.checkOutDateTime": Date.now(),
          "society.visitors.$.outVehicleNumber": outVehicleNumber,
          "society.visitors.$.outGateNumber": outGateNumber,
          "society.visitors.$.qrImage": null,
        },
      },
      { new: true }
    );
    if (!updatedVisitor) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Visitor checked out successfully" });
  } catch (error) {
    console.log("Error in checking out visitor:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred in checking out visitor",
    });
  }
};

exports.checkInVisitor = async (req, res) => {
  try {
    const { societyId, visitorId, inGateNumber, inVehicleNumber } = req.body;

    // Find the visitor by societyId and visitorId
    const visitor = await Visitor.findOne({
      "society.societyId": societyId,
      "society.visitors.visitorId": visitorId,
    });

    // If no visitor found, return 404
    if (!visitor) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    // Find the specific visitor in the visitors array
    const specificVisitor = visitor.society.visitors.find(
      (v) => v.visitorId === visitorId
    );

    // Check if the specific visitor already has checkInDateTime set
    if (specificVisitor.checkInDateTime && !specificVisitor.checkOutDateTime) {
      return res
        .status(400)
        .json({ success: false, message: "Visitor is already checked in" });
    }

    if (specificVisitor.checkInDateTime && specificVisitor.checkOutDateTime) {
      const newVisitor = {
        visitorId: specificVisitor.visitorId,
        name: specificVisitor.name,
        date: specificVisitor.date,
        phoneNumber: specificVisitor.phoneNumber,
        block: specificVisitor.block,
        flatNo: specificVisitor.flatNo,
        role: specificVisitor.role,
        inGateNumber: specificVisitor.inGateNumber,
        status: "Check In",
        userAccess: specificVisitor.userAccess,
        reason: specificVisitor.reason,
        inVehicleNumber: specificVisitor.inVehicleNumber,
        details: specificVisitor.details,
        company: specificVisitor.company,
        pictures: specificVisitor.pictures,
        qrImage: specificVisitor.qrImage,
        checkInDateTime: new Date(),
      };

     const newEntry= await Visitor.findOneAndUpdate(
        { "society.societyId": societyId },
        { $push: { "society.visitors": newVisitor } },
        { new: true, upsert: true }
      );

      if (!newEntry) {
        return res
          .status(404)
          .json({ success: false, message: "Visitor not found" });
      }
      res
        .status(200)
        .json({ success: true, message: "Visitor checked in successfully" });
    }
    if (!specificVisitor.checkInDateTime && !specificVisitor.checkOutDateTime) {
const updatedVisitor = await Visitor.findOneAndUpdate(
      {
        "society.societyId": societyId,
        "society.visitors.visitorId": visitorId,
      },
      {
        $set: {
          "society.visitors.$.status": "Check In",
          "society.visitors.$.checkInDateTime": new Date(),
          "society.visitors.$.inGateNumber": inGateNumber,
          "society.visitors.$.inVehicleNumber": inVehicleNumber,
          "society.visitors.$.checkInDateTime": new Date(),
        },
      },
      { new: true }
    );

    // Handle case where visitor is not found after update attempt
    if (!updatedVisitor) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Visitor checked in successfully" });
    }

    // Update the visitor's status and checkInDateTime
    
  } catch (error) {
    console.log("Error in checking in visitor:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred in checking in visitor",
    });
  }
};

exports.getAllVisitorsBySocietyId = async (req, res) => {
  try {
    const { societyId } = req.params;
    const society = await Visitor.findOne({ "society.societyId": societyId });

    if (!society) {
      return res
        .status(404)
        .json({ success: false, message: "Society not found" });
    }
    res.status(200).json({ success: true, visitors: society.society.visitors });
  } catch (error) {
    console.log("Error in getting all visitors by societyId:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred in getting visitors",
    });
  }
};

// Get visitor by visitorId and societyId
exports.getVisitorByIdAndSocietyId = async (req, res) => {
  try {
    const { societyId, visitorId } = req.params;
    const society = await Visitor.findOne({
      "society.societyId": societyId,
      "society.visitors.visitorId": visitorId,
    });

    if (!society) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    const visitor = society.society.visitors.find(
      (v) => v.visitorId === visitorId
    );
    res.status(200).json({ success: true, visitor });
  } catch (error) {
    console.log("Error in getting visitor by id and societyId:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred in getting visitor",
    });
  }
};

// Get visitors by societyId in the last 24 hours
exports.getVisitorsBySocietyIdLast24Hours = async (req, res) => {
  try {
    const { societyId } = req.params;
    const society = await Visitor.findOne({ "society.societyId": societyId });

    if (!society) {
      return res
        .status(404)
        .json({ success: false, message: "Society not found" });
    }

    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentVisitors = society.society.visitors.filter(
      (visitor) => new Date(visitor.checkInDateTime) > last24Hours
    );

    res.status(200).json({ success: true, visitors: recentVisitors });
  } catch (error) {
    console.log(
      "Error in getting visitors by societyId in last 24 hours:",
      error
    );
    res.status(500).json({
      success: false,
      message: "An error occurred in getting visitors",
    });
  }
};

exports.getFrequentVisitors = async (req, res) => {
  try {
    const { societyId, block, flatNo } = req.params;
    const society = await Visitor.findOne({
      "society.societyId": societyId,
    });
    if (!society) {
      return res.status(404).json({
        success: false,
        message: "No frequent visitors found for the given criteria",
      });
    }

    // Filter out the frequent visitors based on role and isFrequent
    const frequentVisitors = society.society.visitors.filter((visitor) => {
      return (
        visitor.block === block &&
        visitor.flatNo === flatNo &&
        visitor.role === "Guest" &&
        visitor.isFrequent === true
      );
    });
    res.status(200).json({ success: true, frequentVisitors });
  } catch (error) {
    console.log("Error in getting frequent visitors:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred in getting frequent visitors",
    });
  }
};

// Delete frequent visitor by societyId, block, flatNo, and visitorId
exports.deleteFrequentVisitors = async (req, res) => {
  const { societyId, block, flatNo, visitorId } = req.params;

  try {
    // Find the society document
    const society = await Visitor.findOne({
      "society.societyId": societyId,
      "society.visitors.block": block,
      "society.visitors.flatNo": flatNo,
      "society.visitors.role": "Guest",
      "society.visitors.isFrequent": true,
    });

    // Find the index of the visitor within the society's visitors array
    const visitorIndex = society.society.visitors.findIndex(
      (visitor) => visitor.visitorId === visitorId
    );
    if (visitorIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    // Remove the visitor from the visitors array
    society.society.visitors.splice(visitorIndex, 1);

    // Save the updated society document
    await society.save();

    return res.status(200).json({
      success: true,
      message: "Visitor deleted successfully",
      society,
    });
  } catch (error) {
    console.error("Error deleting visitor:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//get all pre approved Visitors
exports.getPreApprovedVisitors = async (req, res) => {
  try {
    const { societyId, block, flatNo } = req.params;
    // Find the society document by societyId
    const society = await Visitor.findOne({ "society.societyId": societyId });

    if (!society) {
      return res
        .status(404)
        .json({ success: false, message: "Society not found" });
    }

    // Filter out the pre-approved visitors based on block, flatNo, and any other relevant criteria
    const preApprovedVisitors = society.society.visitors.filter((visitor) => {
      return (
        visitor.block === block &&
        visitor.flatNo === flatNo &&
        visitor.status === "Waiting"
      ); // Assuming you have an 'isPreApproved' flag in your Visitor schema
    });

    if (preApprovedVisitors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No pre-approved visitors found for the given criteria",
      });
    }

    res.status(200).json({ success: true, preApprovedVisitors });
  } catch (error) {
    console.log("Error in getting pre-approved visitors:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred in getting pre-approved visitors",
    });
  }
};

//Get all visitors by flat
exports.getAllVisitorsbyFlatNo = async (req, res) => {
  try {
    const { societyId, block, flatNo } = req.params;
    // Find the society document by societyId
    const society = await Visitor.findOne({ "society.societyId": societyId });

    if (!society) {
      return res
        .status(404)
        .json({ success: false, message: "Society not found" });
    }

    // Filter out the pre-approved visitors based on block, flatNo, and any other relevant criteria
    const AllVisitors = society.society.visitors.filter((visitor) => {
      return (
        visitor.block === block &&
        visitor.flatNo === flatNo &&
        visitor.status === "Check Out"
      );
    });

    if (AllVisitors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No pre-approved visitors found for the given criteria",
      });
    }

    res.status(200).json({ success: true, AllVisitors });
  } catch (error) {
    console.log("Error in getting pre-approved visitors:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred in getting pre-approved visitors",
    });
  }
};

exports.userAccess = async (req, res) => {
  try {
    const { societyId, visitorId, userAccess } = req.body;

    if (!societyId || !visitorId || !userAccess) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const visitor = await Visitor.findOne({
      "society.societyId": societyId,
      "society.visitors.visitorId": visitorId,
    });

    if (!visitor) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }
    const specificVisitor = visitor.society.visitors.find(
      (v) => v.visitorId === visitorId
    );

    if (specificVisitor.userAccess) {
      return res
        .status(400)
        .json({ success: false, message: "User access already set" });
    }
    const updatedVisitor = await Visitor.findOneAndUpdate(
      {
        "society.societyId": societyId,
        "society.visitors.visitorId": visitorId,
      },
      {
        $set: {
          "society.visitors.$.userAccess": userAccess,
        },
      },
      { new: true }
    );

    if (!updatedVisitor) {
      return res
        .status(404)
        .json({ success: false, message: "User access not updated" });
    }

    res
      .status(200)
      .json({ success: true, message: "User access updated successfully" });
  } catch (error) {
    console.error("Error in updating user access:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating user access",
    });
  }
};

exports.denyVisitor = async (req, res) => {
  try {
    const { societyId, visitorId } = req.body;
    console.log(societyId, visitorId);
    const visitor = await Visitor.findOne({
      "society.societyId": societyId,
      "society.visitors.visitorId": visitorId,
    });

    if (!visitor) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    const updatedVisitor = await Visitor.findOneAndUpdate(
      {
        "society.societyId": societyId,
        "society.visitors.visitorId": visitorId,
      },
      {
        $set: {
          "society.visitors.$.status": "Reject",
        },
      },
      { new: true }
    );

    if (!updatedVisitor) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    res.status(200).json({ success: true, message: "Visitor Entry Denied" });
    console.log(updatedVisitor);
  } catch (error) {
    console.log("Error in denying visitor:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred in denying visitor",
    });
  }
};
exports.denyVisitor = async (req, res) => {
  try {
    const { societyId, visitorId } = req.body;
    console.log(societyId, visitorId);
    const visitor = await Visitor.findOne({
      "society.societyId": societyId,
      "society.visitors.visitorId": visitorId,
    });

    if (!visitor) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    const updatedVisitor = await Visitor.findOneAndUpdate(
      {
        "society.societyId": societyId,
        "society.visitors.visitorId": visitorId,
      },
      {
        $set: {
          "society.visitors.$.status": "Reject",
        },
      },
      { new: true }
    );

    if (!updatedVisitor) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    res.status(200).json({ success: true, message: "Visitor Entry Denied" });
    console.log(updatedVisitor);
  } catch (error) {
    console.log("Error in denying visitor:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred in denying visitor",
    });
  }
};

exports.deleteEntryVisit = async (req, res) => {
  const { societyId, visitorId, flatNo, block } = req.params;
  console.log(societyId, block, flatNo, visitorId);
  try {
    const society = await Visitor.findOneAndUpdate(
      {
        "society.societyId": societyId,
        "society.visitors.flatNo": flatNo,
        "society.visitors.block": block,
        "society.visitors._id": visitorId,
      },
      {
        $pull: { "society.visitors": { _id: visitorId } },
      },
      { new: true }
    );

    // If no society or visitor is found
    if (!society) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Visitor deleted successfully",
      society,
    });
  } catch (error) {
    console.error("Error deleting visitor:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
