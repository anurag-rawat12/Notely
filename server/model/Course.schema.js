import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    description: String,

    createdBy: {
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

});

export default mongoose.model('Course', courseSchema);