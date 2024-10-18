const mongoose = require('mongoose');

const AmenitySchema = new mongoose.Schema({
    societyId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "SocietyAdmin"
    },
    image: {
        type: String,
    },
    amenityName: {
        type: String,
        required: false
    },
    capacity: {
        type: Number,
    },
    timings: {
        type: String,
    },
    location: {
        type: String,
    },
    cost: {
        type: String,
    },
    chargePer: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Available', 'Booked'],
        default: 'Available',
        required: false
    },
    list: [
        {
            userId: {
                type: String,
                required: false,
            },
            bookedDate: {
                type: Date,
                required: false
            },
            dateOfBooking: {
                type: Date,
                required: false
            },
            payed: {
                type: String,
                required: false
            },
            pending: {
                type: String,
            },
            status: {
                type: String,
                required: false,
                enum: ["InProgress", "Completed", "Cancelled"],
                default: "InProgress"
            },
            eventName: { type: String, required: false },
            arrivalTime: { type: String, required: false },
            departureTime: { type: String, required: false },
            venue: { type: String, required: false },
            numberOfGuests: { type: Number, required: false },
            eventType: { type: String, required: false }, // e.g., Business, Casual, Formal
            paymentDetails: {
                paymentMethod: { type: String, required: false },
                paymentStatus: { type: String, required: false },
                amount: { type: String, required: false },
                paymentDate: { type: Date, required: false },
            },
        }
    ]
});

module.exports = mongoose.model("Amenity", AmenitySchema);