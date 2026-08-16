import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    auth0Id: {
        type: String,
        required: true,
        unique: true
    },

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    avatarUrl: {
        type: String,
        required: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
});

export default mongoose.model('User', userSchema);