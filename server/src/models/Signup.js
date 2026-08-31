import mongoose from 'mongoose';

const signupSchema = new mongoose.Schema({
    shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shift",
        required: true,
      },
      volunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, // self, or the coordinator who signed them up
      },
      status: {
        type: String,
        enum: ["active", "cancelled"],
        default: "active",
      },
      cancelledAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// supports overlap check: "find this volunteer's other active signups"
signupSchema.index({volunteer: 1, status: 1});

// supports fill-state derivation: "count active signups for this shift"
signupSchema.index({shift: 1, status: 1});

const Signup = mongoose.model("Signup", signupSchema);

export default Signup;