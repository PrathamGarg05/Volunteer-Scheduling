import mongoose from 'mongoose';

const programMemberSchema = new mongoose.Schema({
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Program",
        required: true,
      },
      volunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    { timestamps: { createdAt: "addedAt", updatedAt: false } }
);

programMemberSchema.index({ program: 1, volunteer: 1 }, { unique: true });

const ProgramMember = mongoose.model("ProgramMember", programMemberSchema);

export default ProgramMember;