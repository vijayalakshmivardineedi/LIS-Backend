const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    societyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Societys",
        require: true
    },
    userId: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, enum: ['Rent', 'Sale'], required: true }, // Rent or Sale
    type: { type: String,  required: true }, // Flat or Others
    pictures: [{
        img: {
            type: String,
            require: true
        }
    }],
    datePosted: { type: Date, default: Date.now },
    contactNumber: { type: String, required: true },
});

const marketPlaceModel = mongoose.model('MarketPlace', productSchema);
module.exports = marketPlaceModel;
