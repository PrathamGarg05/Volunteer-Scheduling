import mongoose from 'mongoose';

const alertDismissalSchema = new mongoose.Schema(
    {
      shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shift",
        required: true,
      },
      stateEnteredAt: { type: Date, required: true }, // which understaffed "episode" this dismisses
      dismissedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    { timestamps: { createdAt: "dismissedAt", updatedAt: false } }
);

alertDismissalSchema.index({shift: 1, stateEnteredAt: 1});

const AlertDismissal = mongoose.model("AlertDismissal", alertDismissalSchema);

export default AlertDismissal;