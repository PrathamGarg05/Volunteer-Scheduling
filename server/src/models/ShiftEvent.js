import mongoose from 'mongoose';

const shiftEventSchema = new mongoose.Schema(
    {
      shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shift",
        required: true,
      },
      type: {
        type: String,
        enum: ["created", "state_change", "signup", "cancel", "note"],
        required: true,
      },
      oldState: { type: String, default: null },
      newState: { type: String, default: null },
      actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      message: { type: String, default: "" },
    },
    { timestamps: { createdAt: true, updatedAt: false } } // append-only: no updatedAt needed
);

// supports timeline ordering
shiftEventSchema.index({shift: 1, createdAt: 1});

const ShiftEvent = mongoose.model("ShiftEvent", shiftEventSchema);

export default ShiftEvent;
  