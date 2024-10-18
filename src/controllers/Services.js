const multer = require('multer');
const path = require('path');
const fs = require('fs');
const shortid = require('shortid');
const Services = require("../models/Services");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');


// Set to store generated user codes
const generatedUserIdCodes = new Set();

// Function to generate unique user ID code
const generateUserIdCode = () => {
  let userIdCode;
  do {
    userIdCode = '';
    for (let i = 0; i < 6; i++) { // Generating a 6-digit numeric code
      userIdCode += Math.floor(Math.random() * 10); // Random number between 0 and 9
    }
  } while (generatedUserIdCodes.has(userIdCode));
  generatedUserIdCodes.add(userIdCode);
  return userIdCode;
};

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destinationPath = path.join(__dirname, '../Uploads/ServicesPictures');
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }
    cb(null, destinationPath);
  },
  filename: function (req, file, cb) {
    cb(null, shortid.generate() + '-' + file.originalname);
  }
});

const upload = multer({ storage }).fields([
  { name: "pictures", maxCount: 1 },
  { name: "qrImages", maxCount: 1 }
]);

exports.createService = async (req, res) => {

  try {
    // Handle file upload using multer middleware
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const { societyId, serviceType, name, phoneNumber, address, timings } = req.body;

      console.log(req.body)
      // Validate required fields
      if (!societyId || !serviceType || !name || !phoneNumber || !address || !timings) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Generate unique userId using generateUserIdCode function
      const userId = generateUserIdCode();

      const serviceProvider = {
        userid: userId,
        name,
        phoneNumber,
        address,
        timings: Array.isArray(timings) ? timings : [timings], // Ensure timings is an array
        pictures: req.files && req.files['pictures'] && req.files['pictures'].length > 0 ? `/publicServicesPictures/${req.files['pictures'][0].filename}` : undefined,
        qrImages: null
      };

      let updatedService;
      const existingService = await Services.findOne({ 'society.societyId': societyId });

      if (!existingService) {
        // If societyId does not exist, create a new document
        const newService = new Services({
          society: {
            societyId,
            [serviceType]: [serviceProvider] // Add the first service provider for the specified serviceType
          }
        });
        updatedService = await newService.save();
      } else {
        // Society exists, update the existing document
        let updateField = { $push: {} };
        updateField.$push[`society.${serviceType}`] = serviceProvider;

        updatedService = await Services.findOneAndUpdate(
          { 'society.societyId': societyId },
          updateField,
          { new: true }
        );
      }

      if (!updatedService) {
        return res.status(404).json({ success: false, message: 'Failed to create service provider' });
      }

      // Generate QR Code
      const qrCodeFileName = uuidv4() + '.png';
      const qrCodeDir = path.join(__dirname, '../Uploads/ServicesPictures'); // Save QR code in ServicesPictures directory
      const qrCodeFilePath = path.join(qrCodeDir, qrCodeFileName);

      if (!fs.existsSync(qrCodeDir)) {
        fs.mkdirSync(qrCodeDir, { recursive: true });
      }

      await QRCode.toFile(qrCodeFilePath, userId);

      const qrCodeUrl = `/publicQRServicesPictures/${qrCodeFileName}`; // QR Code URL relative to ServicesPictures directory

      // Update service provider with QR Code path
      const updateQuery = {
        $set: {
          [`society.${serviceType}.$.qrImages`]: qrCodeUrl
        }
      };

      await Services.findOneAndUpdate(
        { 'society.societyId': societyId, [`society.${serviceType}.userid`]: userId },
        updateQuery
      );

      res.status(201).json({ success: true, message: 'Service Person Created Successfully' });
    });
  } catch (error) {
    console.error('Error creating service provider:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllServicePersons = async (req, res) => {
  try {
    const { societyId } = req.params;

    const service = await Services.findOne({ 'society.societyId': societyId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found for the given societyId' });
    }
    return res.status(201).json({ success: true, service })

  } catch (error) {
    console.error('Error retrieving service providers:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

exports.getAllServiceTypes = async (req, res) => {
  try {
    const { societyId, serviceType } = req.params;

    const service = await Services.findOne({ 'society.societyId': societyId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found for the given societyId' });
    }

    if (serviceType) {
      // Filter service providers by serviceType
      const providers = service.society[serviceType];
      if (!providers) {
        return res.status(404).json({ success: false, message: `Service type '${serviceType}' not found` });
      }
      return res.status(200).json({ success: true, serviceType: serviceType, providers: providers });
    } else {
      // Return all service types with their providers
      const allServiceTypes = Object.keys(service.society);
      const allProviders = {};
      allServiceTypes.forEach(type => {
        allProviders[type] = service.society[type];
      });

      return res.status(200).json({ success: true, serviceTypes: allServiceTypes, providers: allProviders });
    }
  } catch (error) {
    console.error('Error retrieving service providers:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

exports.getServicePersonById = async (req, res) => {
  try {
    const { societyId, serviceType, userId } = req.params;

    // Find the service document by societyId
    const service = await Services.findOne({ 'society.societyId': societyId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found for the given societyId' });
    }

    if (!serviceType) {
      return res.status(400).json({ success: false, message: 'Service type must be provided' });
    }

    // Find the providers array for the specified serviceType
    const providers = service.society[serviceType];
    if (!providers) {
      return res.status(404).json({ success: false, message: `Service type '${serviceType}' not found` });
    }

    // Find the provider by userId
    const foundProvider = providers.find(provider => provider.userid === userId);
    if (!foundProvider) {
      return res.status(404).json({ success: false, message: `Provider with userId '${userId}' not found in '${serviceType}' service type` });
    }

    return res.status(200).json({ success: true, ServicePerson: foundProvider });
  } catch (error) {
    console.error('Error retrieving service provider:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};




exports.updateServicePerson = async (req, res) => {
  try {
    // Handle file upload using multer middleware
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const { societyId, serviceType, userid, name, phoneNumber, address, timings } = req.body;
      // Validate required fields
      if (!societyId || !serviceType || !userid) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Find the document by societyId
      const service = await Services.findOne({ 'society.societyId': societyId });
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      // Find the specific service provider by userid and serviceType
      const serviceProvider = service.society[serviceType].find(provider => provider.userid === userid);
      if (!serviceProvider) {
        return res.status(404).json({ success: false, message: 'Service provider not found' });
      }

      // Update service provider details
      serviceProvider.name = name;
      serviceProvider.phoneNumber = phoneNumber;
      serviceProvider.address = address;
      serviceProvider.timings = Array.isArray(timings) ? timings : [timings]; // Ensure timings is an array
      console.log("file", req.files)
      // Handle pictures update
      if (req.files && req.files['pictures'] && req.files['pictures'].length > 0) {
        // Delete old picture if exists
        if (serviceProvider.pictures) {
          const oldPicturePath = path.join(__dirname, '../Uploads/ServicesPictures', path.basename(serviceProvider.pictures));
          if (fs.existsSync(oldPicturePath)) {
            fs.unlinkSync(oldPicturePath);
            console.log(`Deleted old picture: ${oldPicturePath}`);
          }
        }
        // Update picture path
        serviceProvider.pictures = `/publicServicesPictures/${req.files['pictures'][0].filename}`;
      }

      // Save the updated document
      await service.save();

      res.status(200).json({ success: true, message: 'Service Person Updated Successfully' });
    });
  } catch (error) {
    console.error('Error updating service provider:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};


exports.deleteServicePerson = async (req, res) => {
  try {
    const { societyId, serviceType, userid } = req.body;
    console.log(societyId, serviceType, userid)
    // Validate required fields
    if (!societyId || !serviceType || !userid) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Find the document by societyId
    const service = await Services.findOne({ 'society.societyId': societyId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Find the specific service provider by userid and serviceType
    const serviceProvider = service.society[serviceType].find(provider => provider.userid === userid);
    if (!serviceProvider) {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }

    // Delete pictures associated with the service provider
    if (serviceProvider.pictures) {
      const picturePath = path.join(__dirname, '../Uploads/ServicesPictures', path.basename(serviceProvider.pictures));
      if (fs.existsSync(picturePath)) {
        try {
          fs.unlinkSync(picturePath);
          console.log(`${picturePath} deleted successfully.`);
        } catch (error) {
          console.error(`Error deleting file ${picturePath}: ${error}`);
        }
      }
    }

    // Delete QR images associated with the service provider
    if (serviceProvider.qrImages) {
      const qrImagePath = path.join(__dirname, '../Uploads/ServicesPictures', path.basename(serviceProvider.qrImages));
      if (fs.existsSync(qrImagePath)) {
        try {
          fs.unlinkSync(qrImagePath);
          console.log(`${qrImagePath} deleted successfully.`);
        } catch (error) {
          console.error(`Error deleting file ${qrImagePath}: ${error}`);
        }
      }
    }

    // Remove the service provider from the array in the database
    service.society[serviceType] = service.society[serviceType].filter(provider => provider.userid !== userid);

    // Save the updated document
    await service.save();

    res.status(200).json({ success: true, message: 'Service Provider Deleted Successfully' });
  } catch (error) {
    console.error('Error deleting service provider:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};


exports.addList = async (req, res) => {

  try {
    const { societyId, serviceType, userid, list } = req.body;

    // Validate required fields
    if (!societyId || !serviceType || !userid || !list || !Array.isArray(list)) {
      return res.status(400).json({ success: false, message: 'Invalid request format' });
    }

    // Find the document by societyId
    const service = await Services.findOne({ 'society.societyId': societyId });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Find the specific service provider by userid and serviceType
    const serviceProvider = service.society[serviceType].find(provider => provider.userid === userid);

    if (!serviceProvider) {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const existingItemIndex = serviceProvider.list.findIndex(existing => existing.userId === item.userId);

      if (existingItemIndex !== -1) {
        // If item with same userId exists, update it
        serviceProvider.list[existingItemIndex] = {
          userId: item.userId,
          Block: item.Block,
          flatNumber: item.flatNumber,
          timings: item.timings,
          reviews: item.reviews,
          rating: item.rating,
        };

        // Include service-specific fields dynamically based on serviceType
        switch (serviceType) {
          case 'milkMan':
            serviceProvider.list[existingItemIndex].liters = item.liters;
            break;
          case 'paperBoy':
            serviceProvider.list[existingItemIndex].newsPaper = item.newsPaper;
            break;
          case 'driver':
            serviceProvider.list[existingItemIndex].workType = item.workType;
            break;
          case 'water':
            serviceProvider.list[existingItemIndex].waterType = item.waterType
            serviceProvider.list[existingItemIndex].liters = item.liters
            // };
            break;
          default:
            break;
        }

      } else {
        const newItem = {
          userId: item.userId,
          Block: item.Block,
          flatNumber: item.flatNumber,
          timings: item.timings,
          reviews: item.reviews,
          rating: item.rating,
        };
        // Include service-specific fields dynamically based on serviceType
        switch (serviceType) {
          case 'milkMan':
            newItem.liters = item.liters;
            break;
          case 'paperBoy':
            newItem.newsPaper = item.newsPaper;
            break;
          case 'driver':
            newItem.workType = item.workType;
            break;
          case 'water':
            newItem.waterType = item.waterType;
            newItem.liters = item.liters
            break;
          default:
            break;
        }
        serviceProvider.list.push(newItem);

      }
    }
    await service.save();
    res.status(200).json({ success: true, message: 'Successfully Added the Service', service });
  } catch (error) {
    console.error('Error adding or updating list item(s):', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUserService = async (req, res) => {
  const { societyId, serviceType, userid, userIdToDelete } = req.body;
  try {
    // Validate required fields
    if (!societyId || !serviceType || !userid || !userIdToDelete) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Find the document by societyId
    const service = await Services.findOne({ 'society.societyId': societyId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Find the specific service provider by userid and serviceType
    const serviceProvider = service.society[serviceType].find(provider => provider.userid === userid);
    if (!serviceProvider) {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }

    // Find the item to delete from the list array based on userIdToDelete
    const itemToDeleteIndex = serviceProvider.list.findIndex(item => item.userId === userIdToDelete);
    if (itemToDeleteIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item to delete not found in the list' });
    }

    // Remove the item from the list array
    serviceProvider.list.splice(itemToDeleteIndex, 1);

    // Save the updated document
    await service.save();

    res.status(200).json({ success: true, message: 'List Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};





exports.getServicesByFlatAndBlock = async (req, res) => {
  const { societyId, block, flatNumber } = req.params;
  // const { block, flatNumber } = req.query;

  if (!societyId || !block || !flatNumber) {
    return res.status(400).json({ message: 'Missing required fields: societyId, block, and flatNumber are required.' });
  }

  try {
    const services = await Services.findOne({
      'society.societyId': societyId,
      $or: [
        { 'society.maid.list': { $elemMatch: { Block: block, flatNumber: Number(flatNumber) } } },
        { 'society.milkMan.list': { $elemMatch: { Block: block, flatNumber: Number(flatNumber) } } },
        { 'society.cook.list': { $elemMatch: { Block: block, flatNumber: Number(flatNumber) } } },
        { 'society.paperBoy.list': { $elemMatch: { Block: block, flatNumber: Number(flatNumber) } } },
        { 'society.driver.list': { $elemMatch: { Block: block, flatNumber: Number(flatNumber) } } },
        { 'society.water.list': { $elemMatch: { Block: block, flatNumber: Number(flatNumber) } } },
        { 'society.plumber.list': { $elemMatch: { Block: block, flatNumber: Number(flatNumber) } } },
        { 'society.carpenter.list': { $elemMatch: { Block: block, flatNumber: Number(flatNumber) } } },
        { 'society.electrician.list': { $elemMatch: { Block: block, flatNumber: Number(flatNumber) } } },
        { 'society.painter.list': { $elemMatch: { Block: block, flatNumber: Number(flatNumber) } } },
        { 'society.moving.list': { $elemMatch: { Block: block, flatNumber: Number(flatNumber) } } },
        { 'society.mechanic.list': { $elemMatch: { Block: block, flatNumber: Number(flatNumber) } } },
        { 'society.appliance.list': { $elemMatch: { Block: block, flatNumber: Number(flatNumber) } } },
        { 'society.pestClean.list': { $elemMatch: { Block: block, flatNumber: Number(flatNumber) } } }
      ]
    });

    if (!services) {
      return res.status(404).json({ message: 'No services found for the given criteria.' });
    }

    // Filter the matched services to only include the relevant items in the list
    const filteredServices = {
      maid: services.society.maid.filter(service => service.list.some(entry => entry.Block === block && entry.flatNumber === Number(flatNumber))),
      milkMan: services.society.milkMan.filter(service => service.list.some(entry => entry.Block === block && entry.flatNumber === Number(flatNumber))),
      cook: services.society.cook.filter(service => service.list.some(entry => entry.Block === block && entry.flatNumber === Number(flatNumber))),
      paperBoy: services.society.paperBoy.filter(service => service.list.some(entry => entry.Block === block && entry.flatNumber === Number(flatNumber))),
      driver: services.society.driver.filter(service => service.list.some(entry => entry.Block === block && entry.flatNumber === Number(flatNumber))),
      water: services.society.water.filter(service => service.list.some(entry => entry.Block === block && entry.flatNumber === Number(flatNumber))),
      plumber: services.society.plumber.filter(service => service.list.some(entry => entry.Block === block && entry.flatNumber === Number(flatNumber))),
      carpenter: services.society.carpenter.filter(service => service.list.some(entry => entry.Block === block && entry.flatNumber === Number(flatNumber))),
      electrician: services.society.electrician.filter(service => service.list.some(entry => entry.Block === block && entry.flatNumber === Number(flatNumber))),
      painter: services.society.painter.filter(service => service.list.some(entry => entry.Block === block && entry.flatNumber === Number(flatNumber))),
      moving: services.society.moving.filter(service => service.list.some(entry => entry.Block === block && entry.flatNumber === Number(flatNumber))),
      mechanic: services.society.mechanic.filter(service => service.list.some(entry => entry.Block === block && entry.flatNumber === Number(flatNumber))),
      appliance: services.society.appliance.filter(service => service.list.some(entry => entry.Block === block && entry.flatNumber === Number(flatNumber))),
      pestClean: services.society.pestClean.filter(service => service.list.some(entry => entry.Block === block && entry.flatNumber === Number(flatNumber))),
    };
    res.status(200).json({ services: filteredServices });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services', error });
  }
};
exports.updateReviewAndRating = async (req, res) => {
  const { societyId, serviceType, userid, updates } = req.body;

  try {
    // Validate required fields
    if (!societyId || !serviceType || !userid || !updates) {
      return res.status(400).json({ success: false, message: 'Invalid request format' });
    }

    // Ensure updates is an object
    if (typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'Updates must be an object' });
    }

    // Find the document by societyId
    const service = await Services.findOne({ 'society.societyId': societyId });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Find the specific service provider by userid and serviceType
    const serviceProvider = service.society[serviceType].find(provider => provider.userid === userid);

    if (!serviceProvider) {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }

    const { userId, Block, flatNumber, reviews, rating } = updates;
    const existingItemIndex = serviceProvider.list.findIndex(item =>
      item.userId === userId && item.Block === Block && item.flatNumber === flatNumber
    );
    if (existingItemIndex !== -1) {
      // If item with the same userId, Block, and flatNumber exists, update reviews and rating
      serviceProvider.list[existingItemIndex].reviews = reviews;
      serviceProvider.list[existingItemIndex].rating = rating;
    } else {
      // If item with the given criteria does not exist, you can choose to handle it (e.g., ignore or return an error)
      console.log(`List item with userId ${userId}, Block ${Block}, and flatNumber ${flatNumber} not found`);
    }

    await service.save();
    res.status(200).json({ success: true, message: 'Reviews and ratings updated successfully', service });
  } catch (error) {
    console.error('Error updating reviews and ratings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


