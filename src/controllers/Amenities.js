const mongoose = require("mongoose");
const Amenity = require("../models/Amenities");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const shortid = require("shortid");
const AdminNotification = require("../models/AdminNotification");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destinationPath = path.join(__dirname, "../Uploads/Amenity");
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }
    cb(null, destinationPath);
  },
  filename: function (req, file, cb) {
    cb(null, shortid.generate() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage }).single("image");

exports.createAmenity = async (req, res) => {
  try {
    upload(req, res, async err => {
      if (err) {
        console.error("Error in uploading file:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while uploading the file"
        });
      }
      try {
        const { societyId, amenityName, capacity, timings, location, cost, chargePer, status } = req.body;

        const imagePath = req.file ? `/publicAmenity/${req.file.filename}` : "";
        const newAmenity = new Amenity({
          societyId,
          image: imagePath,
          amenityName,
          capacity,
          timings,
          location,
          cost,
          chargePer,
          status,
        });
        await newAmenity.save();

        return res.status(201).json({ success: true, message: "Amenity created successfully", asset: newAmenity });
      } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, error: error });
      }
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: "Error in " });
  }
};



exports.getAllAmenityBySocietyId = async (req, res) => {
  const { societyId } = req.params;
  try {
    const society = await Amenity.find({ societyId });
    if (!society) {
      return res.status(404).json({ success: false, message: "Society not found" });
    }
    return res.json({ success: true, society });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err });
  }
};

exports.getAmenityById = async (req, res) => {
  const { id } = req.params;
  console.log(id)
  try {
    const amenity = await Amenity.findById(id);
    if (!amenity) {
      return res.status(404).json({ success: false, message: "Amenity not found" });
    }
    return res.status(201).json({ success: true, amenity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAmenityOfCommunityHal = async (req, res) => {
  const { societyId } = req.params;
  try {
    const amenity = await Amenity.findOne({
      "societyId": societyId,
      "amenityName": "Community Hall"
    });
    if (!amenity) {
      return res.status(404).json({ success: false, message: "Amenity not found" });
    }
    return res.json({ success: true, amenity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err });
  }
};


exports.updateAmenity = async (req, res) => {
  const { id } = req.params;
  try {
    upload(req, res, async err => {
      if (err) {
        console.error("Error in uploading file:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while uploading the file"
        });
      }
      try {
        const updateFields = { ...req.body };
        if (req.file) {
          // Delete the old image if it exists
          const amenity = await Amenity.findById(id);
          if (amenity && amenity.image) {
            const oldImagePath = path.join(__dirname, "../Uploads/Amenity", path.basename(amenity.image));
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
          updateFields.image = `/publicAmenity/${req.file.filename}`;
        }

        const updatedAmenity = await Amenity.findByIdAndUpdate(id, updateFields, { new: true });
        if (!updatedAmenity) {
          return res.status(404).json({ success: false, message: "Amenity not found" });
        }

        return res.json({ success: true, message: "Amenity updated successfully", amenity: updatedAmenity });
      } catch (error) {
        console.error(`Error updating amenity: ${error}`);
        return res.status(500).json({ success: false, error: error.message });
      }
    });
  } catch (error) {
    console.error(`Error: ${error}`);
    return res.status(500).json({ success: false, message: "Error in processing request" });
  }
};

exports.deleteAmenity = async (req, res) => {
  const { id } = req.params;
  try {
    const amenity = await Amenity.findById(id);
    if (!amenity) {
      return res.status(404).json({ success: false, message: "Amenity not found" });
    }

    // Delete the image from the filesystem
    if (amenity.image) {
      const imagePath = path.join(__dirname, "../Uploads/Amenity", path.basename(amenity.image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Amenity.findByIdAndDelete(id);

    return res.json({ success: true, message: "Amenity deleted successfully" });
  } catch (error) {
    console.error(`Error deleting amenity: ${error}`);
    return res.status(500).json({ success: false, error: error.message });
  }
};


exports.bookAmenity = async (req, res) => {
  const { id } = req.params; // Amenity ID
  console.log(id)
  const {
    userId,
    dateOfBooking,
    payed,
    pending,
    eventName,
    arrivalTime,
    departureTime,
    venue,
    numberOfGuests,
    eventType,
    paymentDetails
  } = req.body;


  try {
    const amenity = await Amenity.findById(id);
    if (!amenity) {
      return res.status(404).json({ success: false, message: "Amenity not found" });
    }

    const newBooking = {
      userId: userId,
      bookedDate: Date.now(),
      dateOfBooking: dateOfBooking,
      payed: payed,
      pending: pending,
      status: "InProgress",
      eventName: eventName,
      arrivalTime: arrivalTime,
      departureTime: departureTime,
      venue: venue,
      numberOfGuests: numberOfGuests,
      eventType: eventType,
      paymentDetails: paymentDetails // Add this line to include payment details
    };

    // Push the new booking object into the amenity's list

    amenity.list.push(newBooking);

    // Save the updated amenity
    await amenity.save();

    const notification = new AdminNotification({
      societyId: amenity.societyId,
      title: "Ameniety Booking",
      message: `Function Hall Booked`,
      category: "amenietyBooking",
      userId: userId,
    });
    await notification.save();
    return res.status(201).json({ success: true, message: "Amenity booked successfully" });
  } catch (error) {
    console.error(`Error booking amenity: ${error}`);
    return res.status(500).json({ success: false, error: error.message });
  }
};


exports.getAmenityByIdAndUserId = async (req, res) => {
  const { id, userId } = req.params;

  try {
    // Find all amenities by societyId and amenityHall name "Community Hall"
    const amenities = await Amenity.find({ societyId: id, amenityName: "Community Hall" });

    // Check if any amenities are found
    if (!amenities || amenities.length === 0) {
      return res.status(404).json({ success: false, message: "No Community Hall amenities found for this society" });
    }

    // Iterate through amenities to find all bookings for the specified userId
    let bookings = [];
    let amenityName = ''; // Optional: To return the amenity name where the booking is found

    for (let amenity of amenities) {
      if (Array.isArray(amenity.list)) {
        // Find all bookings for the specified userId in the current amenity
        const userBookings = amenity.list.filter((booking) => booking.userId === userId);

        if (userBookings.length > 0) {
          bookings = bookings.concat(userBookings); // Append all user bookings to the array
          amenityName = amenity.amenityName; // Set the amenity name if bookings are found
        }
      }
    }

    // Check if any bookings are found
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: "No bookings found for this user in the Community Hall" });
    }

    return res.json({ success: true, bookings, amenityName });
  } catch (error) {
    console.error(`Error fetching amenity: ${error}`);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Update Amenity Booking
exports.updateAmenityBooking = async (req, res) => {
  const { id, userId } = req.params;  // 'id' refers to societyId in this case
  try {
    // Use findOne to search for amenity by societyId
    const amenity = await Amenity.findOne({ societyId: id, amenityName: "Community Hall" });

    if (!amenity) {
      return res.status(404).json({ success: false, message: "Amenity not found" });
    }

    const bookingIndex = amenity.list.findIndex((booking) => booking.userId.toString() === userId);
    if (bookingIndex === -1) {
      return res.status(404).json({ success: false, message: "Booking not found for this user" });
    }

    const updateFields = req.body;
    // Merge the updated fields with the existing booking
    amenity.list[bookingIndex] = { ...amenity.list[bookingIndex]._doc, ...updateFields };
    await amenity.save();

    return res.json({ success: true, message: "Booking updated successfully" });
  } catch (error) {
    console.error(`Error updating booking: ${error}`);
    return res.status(500).json({ success: false, error: error.message });
  }
};



// Delete Amenity Booking
exports.deleteAmenityBooking = async (req, res) => {
  const { id, userId } = req.params;
  try {
    console.log("Society ID:", id, "User ID:", userId);

    const amenity = await Amenity.findOne({ societyId: id, amenityName: "Community Hall" });
    if (!amenity) {
      return res.status(404).json({ success: false, message: "Amenity not found" });
    }
    const bookingIndex = amenity.list.findIndex((booking) => {
      return booking.userId.trim() === userId.trim();
    });
    if (bookingIndex === -1) {
      return res.status(404).json({ success: false, message: "Booking not found for this user" });
    }
    amenity.list.splice(bookingIndex, 1);
    await amenity.save();
    return res.json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    console.error(`Error deleting booking: ${error}`);
    return res.status(500).json({ success: false, error: error.message });
  }
};
