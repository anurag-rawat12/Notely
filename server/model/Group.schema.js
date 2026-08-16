import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    inviteCode: {
        type: String,
        unique: true
    }, // for join-by-code

    createdAt: {
        type: Date,
        default: Date.now
    },
});

export default mongoose.model("Group", groupSchema);