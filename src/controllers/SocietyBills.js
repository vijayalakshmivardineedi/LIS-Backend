const SocietyBills = require('../models/SocietyBills');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const shortid = require('shortid');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destinationPath = path.join(__dirname, '../Uploads/SocietyBills');
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }
    cb(null, destinationPath);
  },
  filename: function (req, file, cb) {
    cb(null, shortid.generate() + '-' + file.originalname);
  }
});

const upload = multer({ storage }).single('pictures');

exports.createBill = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error uploading file' });
      }

      try {
        const { societyId, name, status, amount, monthAndYear } = req.body; 
        let pictures = {};

        if (req.file) {
          pictures = `/publicSocietyBills/${req.file.filename}`;
        }

        const existingSociety = await SocietyBills.findOne({ 'society.societyId': societyId });

        if (existingSociety) {
          existingSociety.society.bills.push({
            name,
            status,
            amount,
            date: Date.now(),
            monthAndYear,
            pictures: pictures
          });

          await existingSociety.save();
        } else {
          const societyBill = new SocietyBills({
            society: {
              societyId,
              bills: [{ 
                name,
                status,
                amount,
                date: Date.now(),
                monthAndYear,
                pictures: pictures
              }]
            }
          });

          await societyBill.save();
        }

        return res.status(201).json({ success: true, message: "Bill created successfully" });
      } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error}` });
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error in creating bill" });
  }
};

exports.getBillsBySocietyId = async (req, res) => {
  const { societyId } = req.params;
  try {
    const bills = await SocietyBills.find({ 'society.societyId': societyId }, { 'society': 1, '_id': 0 });

    if (bills.length === 0) {
      return res.status(201).json({ success: true, society:bills });
    }

    return res.status(200).json({ success: true, society: bills[0].society });

  } catch (error) {
    return res.status(500).json({ success: false, message: `Error: ${error}` });
  }
};



exports.getBillById = async (req, res) => {
  const { societyId, id } = req.params;
  try {
    const bill = await SocietyBills.findOne(
      { 
        'society.societyId': societyId,
        'society.bills._id': id 
      },
      { 
        'society.bills.$': 1 
      }
    );

    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }
    
    return res.status(200).json({ success: true, bill: bill.society.bills[0] });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).json({ success: false, message: `Error: ${error}` });
  }
};



exports.editBill = async (req, res) => {
  try {
    upload(req, res, async (error) => {
      if (error) {
        console.error('Error uploading files:', error);
        return res.status(500).json({ success: false, message: 'Error in uploading files', error: error.message });
      }

      const { id, societyId } = req.params;
      const updateFields = { ...req.body };
      delete updateFields.id; // Remove id from updateFields if it's part of req.body

      try {
        // Find the specific bill document
        const billDocument = await SocietyBills.findOne({
          'society.societyId': societyId,
          'society.bills._id': id
        });

        if (!billDocument) {
          return res.status(404).json({ success: false, message: 'Bill not found' });
        }

        const billItem = billDocument.society.bills.id(id);

        if (req.file) {
          // Handle existing picture deletion if it exists
          if (billItem.pictures) {
            const oldImagePath = path.join(__dirname, '../Uploads/SocietyBills', path.basename(billItem.pictures));
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }

          // Update new picture in updateFields
          updateFields.pictures = `/publicSocietyBills/${req.file.filename}`;
        }

        // Update the specific bill item in the bills array
        billItem.set(updateFields);

        await billDocument.save();

        res.status(200).json({ success: true, message: 'Bill updated successfully' });
      } catch (updateError) {
        console.error('Error updating bill:', updateError);
        res.status(500).json({ success: false, message: 'Failed to update bill', error: updateError.message });
      }
    });
  } catch (error) {
    console.error('Unknown error:', error);
    res.status(500).json({ success: false, message: 'Unknown error', error: error.message });
  }
};


exports.deleteBill = async (req, res) => {
  try {
    const { societyId, id } = req.params;
    const bill = await SocietyBills.findOne({ 'society.societyId': societyId, 'society.bills._id': id });

    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }

    // Delete image if exists
    const billItem = bill.society.bills.id(id);
    if (billItem.pictures) {
      const imagePath = path.join(__dirname, '../Uploads/SocietyBills', path.basename(billItem.pictures));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await SocietyBills.updateOne(
      { 'society.societyId': societyId, 'society.bills._id': id },
      { $pull: { 'society.bills': { _id: id } } }
    );

    return res.status(200).json({ success: true, message: "Bill deleted successfully" });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).json({ success: false, message: "Error in deleting bill" });
  }
};

