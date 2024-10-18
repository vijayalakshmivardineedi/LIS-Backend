const EmergencyContact = require('../models/EmergencyContacts');

// Get all emergency contacts
exports.getAllEmergencyContacts = async (req, res) => {
    try {
        const emergencyContacts = await EmergencyContact.find();
        res.json(emergencyContacts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a new emergency contact
exports.createEmergencyContact = async (req, res) => {
    const emergencyContact = new EmergencyContact({
        name: req.body.name,
        profession: req.body.profession,
        phoneNumber: req.body.phoneNumber,
        societyId: req.body.societyId,// Assuming you pass the apartment ID
        serviceType: req.body.serviceType
    });
     try {
        const newEmergencyContact = await emergencyContact.save();
        res.status(201).json(newEmergencyContact,{ message: 'Successfully Created' });
    } catch (err) {
        res.status(400).json({ message: 'Emergency contacts not created' });
    }
};

// Get a specific emergency contact
exports.getEmergencyContactBySocietyId = async (req, res, next) => {
    const { societyid } = req.params;

    console.log('Society ID received:', societyid); 

    try {
        const emergencyContacts = await EmergencyContact.find({ societyId: societyid });

        if (emergencyContacts.length === 0) {
            return res.status(404).json({ message: 'Emergency contacts not found for this society id' });
        }

        res.json(emergencyContacts);
    } catch (err) {
        console.error('Error fetching emergency contacts:', err); // Log any errors that occur
        res.status(500).json({ message: err.message });
    }
};

// Update an emergency contact
exports.updateEmergencyContact = async (req, res) => {
    const { name, phoneNumber, profession, serviceType } = req.body; // Include serviceType if needed
    
    try {
        const emergencyContact = await EmergencyContact.findByIdAndUpdate(
            req.params.id,
            { name, phoneNumber, profession, serviceType }, 
            { new: true, runValidators: true }
        );

        if (!emergencyContact) {
            return res.status(404).json({ message: 'Emergency contact not found' });
        }

        res.json({ 
            message: 'Emergency contact updated successfully.', 
            emergencyContact 
        });
    } catch (err) {
        console.error("Error updating emergency contact:", err);
        res.status(400).json({ message: 'Failed to update emergency contact. ' + err.message });
    }
};


// Delete an emergency contact
exports.deleteEmergencyContact = async (req, res) => {
    try {
        const emergencyContact = await EmergencyContact.findByIdAndDelete(req.params.id);
        if (emergencyContact == null) {
            return res.status(404).json({ message: 'Emergency contact not found' });
        }
        res.json({ message: 'Deleted Emergency Contact' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
