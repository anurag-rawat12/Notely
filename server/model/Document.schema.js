import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId, ref: "User",
        required: true
    },

    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    },

    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    }, // null if personal upload

    status: {
        type: String,
        enum: ["processing", "completed", "failed"],
        default: "processing"
    },

    chunkCount: Number,

    createdAt: {
        type: Date,
        default: Date.now
    },
});

export default mongoose.model("Document", documentSchema);