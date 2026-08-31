import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Program",
        required: true,
      },
      date: { type: Date, required: true },
      startTime: { type: String, required: true }, // "HH:mm" 24hr format
      durationMinutes: { type: Number, required: true, min: 1 },
      location: { type: String, required: true, trim: true },
      requiredHeadcount: { type: Number, required: true, min: 1 },
      status: {
        type: String,
        enum: ["Open", "Partially Filled", "Filled", "Closed"],
        default: "Open",
      },
    },
    { timestamps: true}
);
// supports goal 6: search/filter/sort shifts by program, date, and status
shiftSchema.index({program: 1, date: 1, status: 1});

// supports goal 6: free-text search for shifts by location
shiftSchema.index({location: "text"});

const Shift = mongoose.model("Shift", shiftSchema);

export default Shift;