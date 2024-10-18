

const Advertisements = require('../models/Advertisements');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const shortid = require('shortid');
const UserProfile = require('../models/UserProfile');
const Societys = require('../models/Authentication/SocietyAdmin');
const AdminNotification = require('../models/AdminNotification');
const storage = multer.diskStorage({
  destination: function (res, file, cb) {
    const destinationPath = path.join(__dirname, '../Uploads/Advertisements')
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true })
    }
    cb(null, destinationPath)
  },
  filename: function (res, file, cb) {
    cb(null, shortid.generate() + '-' + file.originalname)
  }
})

const upload = multer({ storage }).fields([
  { name: "pictures", maxCount: 5 }
]);

exports.createAdvertisements = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'An error occurred while uploading files' });
      }

      try {
        const { societyId, adv, details, userName, phoneNumber, status } = req.body;

        let pictures = [];

        if (req.files && req.files['pictures']) {
          pictures = req.files['pictures'].map(image => ({
            img: `/publicPictures/${image.filename}`,
          }));
        }

        const parsedDetails = JSON.parse(details);
        const buildingName = parsedDetails.block;
        const flatNumber = parsedDetails.flat_No;

        const userdata = await UserProfile.findOne({
          societyId: societyId,
          buildingName: buildingName,
          flatNumber: flatNumber,
          userType: 'Owner',
        });

        if (!userdata) {
          return res.status(402).json({ success: false, message: 'User not registered' });
        }

        const userId = userdata.userId;

        const advertisement = new Advertisements({
          societyId,
          userId,
          adv,
          status,
          details: parsedDetails,
          userName,
          phoneNumber,
          pictures,
        });

        await advertisement.save();

        // Notification
        const notification = new AdminNotification({
          societyId: societyId,
          title: "Advertisement",
          message: "New Post uploaded",
          category: "Adds_notification",
          userId: userId,
        });

        await notification.save();

        // Send a single response after everything is done
        return res.status(201).json({ success: true, message: 'Successfully added', notification });
      } catch (error) {
        console.log(`Error: ${error}`);
        return res.status(401).json({ success: false, message: `Error: ${error.message}` });
      }
    });
  } catch (error) {
    console.log(`Error in: ${error}`);
    return res.status(301).json({ success: false, message: 'An error occurred while processing the request' });
  }
};


exports.getAllAdds = async (req, res) => {
  try {
    const addv = await Advertisements.find();

    if (!addv) {
      return res.status(201).json({ success: false, message: "No Adds Found" })
    }
    return res.status(201).json({ success: true, addv })
  } catch (error) {
    return res.status(300).json({ success: false, message: `error is ${error}` })
  }
}

exports.getAdvertisements = async (req, res) => {
  const { societyId } = req.params;
  try {
    const addv = await Advertisements.find({ societyId: societyId });
    if (!societyId) {
      return res.status(201).json({ success: false, message: "No Match Found" })
    }
    return res.status(201).json({ success: true, addv })
  } catch (error) {
    return res.status(300).json({ success: false, message: `error is ${error}` })
  }
}

exports.getAdvertisementsByAdv = async (req, res) => {
  try {
    const { adv } = req.params;
    const advertisement = await Advertisements.find({ adv });
    if (advertisement.length === 0) {
      return res.status(301).json({ success: false, message: "No Match Found" })
    }
    return res.status(201).json({ success: true, advertisement });
  } catch (error) {
    return res.status(401).json({ succes: false, meesage: `error is:${error}` })
  }
}

exports.getAdvertisementsById = async (req, res) => {
  try {
    const { id } = req.params;
    // const ads = await Advertisements.find().populate('societyId', 'societyName');
    const advertisement = await Advertisements.findById(id).populate('societyId');
    if (!advertisement) {
      return res.status(301).json({ success: false, message: "No Match Found" })
    }
    return res.status(201).json({ success: true, advertisement });
  } catch (error) {
    return res.status(401).json({ succes: false, meesage: `error is:${error}` })
  }
}

exports.editAdvertisement = async (req, res) => {
  try {
    upload(req, res, async (error) => {
      if (error) {
        console.error('Error uploading files:', error);
        return res.status(500).json({ success: false, message: 'Error in uploading files', error });
      }

      const { id } = req.params;
      const uploadFields = { ...req.body };
      delete uploadFields.id;

      try {
        const advertisement = await Advertisements.findById(id);
        if (!advertisement) {
          return res.status(404).json({ success: false, message: 'Advertisement not found' });
        }

        if (req.files && req.files['pictures'] && req.files['pictures'].length > 0) {
          // Handle existing pictures deletion if they exist
          if (advertisement.pictures && advertisement.pictures.length > 0) {
            advertisement.pictures.forEach(picture => {
              const imagePath = path.join(__dirname, '../Uploads/Advertisements', path.basename(picture.img));
              if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
              } else {
              }
            });
          }

          // Update new pictures in uploadFields
          const pictures = req.files['pictures'].map(file => ({
            img: `/publicPictures/${file.filename}`
          }));
          uploadFields.pictures = pictures;
        }

        // Update advertisement in database
        const updatedAdvertisement = await Advertisements.findByIdAndUpdate(id, { $set: uploadFields }, { new: true });

        // Respond with success message and updated advertisement data
        res.status(200).json({ success: true, message: 'Advertisement updated successfully', data: updatedAdvertisement });
      } catch (error) {
        console.error('Error updating advertisement:', error);
        res.status(500).json({ success: false, message: 'Failed to update advertisement', error: error.message });
      }
    });
  } catch (error) {
    console.error('Unknown error:', error);
    res.status(500).json({ success: false, message: 'Unknown error', error: error.message });
  }
};



exports.deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const advertisement = await Advertisements.findById(id);

    if (!advertisement) {
      return res.status(404).json({ success: false, message: "No Match Found" });
    }

    // Delete advertisement pictures from the filesystem
    if (advertisement.pictures && advertisement.pictures.length > 0) {
      await Promise.all(advertisement.pictures.map(async (picture) => {
        const imagePath = path.join(__dirname, '../Uploads/Advertisements', path.basename(picture.img));
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
          } catch (error) {
            console.error(`Error deleting file ${imagePath}: ${error}`);
          }
        }
      }));
    }

    // Delete the advertisement document from the database
    await Advertisements.findByIdAndDelete(advertisement); // Using remove method
    return res.status(200).json({ success: true, message: "Successfully Removed" });

  } catch (error) {
    console.error(`Error deleting advertisement: ${error}`);
    return res.status(500).json({ success: false, message: "Internal Server Error", error });
  }
};



exports.getSocietiesByAdvertisements = async (req, res) => {
  try {
    // Fetch advertisements and populate societyId
    const ads = await Advertisements.find().populate('societyId', 'societyName');

    if (!ads || ads.length === 0) {
      return res.status(404).json({ success: false, message: "No Advertisements Found" });
    }

    // Create a map to group advertisements by societyId
    const adsBySociety = ads.reduce((acc, ad) => {
      const societyId = ad.societyId._id.toString();
      if (!acc[societyId]) {
        acc[societyId] = [];
      }
      acc[societyId].push(ad);
      return acc;
    }, {});

    // Extract unique societyIds from advertisements
    const societyIds = Object.keys(adsBySociety);

    // Fetch societies based on the unique societyIds
    const societies = await Societys.find({ _id: { $in: societyIds } });

    if (!societies || societies.length === 0) {
      return res.status(404).json({ success: false, message: "No Societies Found" });
    }

    // Attach advertisements to their respective societies
    const societiesWithAds = societies.map(society => {
      return {
        ...society.toObject(),
        advertisements: adsBySociety[society._id.toString()] || []
      };
    });

    return res.status(200).json({ success: true, societies: societiesWithAds });
  } catch (error) {
    return res.status(500).json({ success: false, message: `Error: ${error.message}` });
  }
};
