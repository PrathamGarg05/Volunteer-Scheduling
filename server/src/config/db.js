import mongoose from "mongoose";
import { MONGO_URI } from "./env.js";

export const connectDB = async() => {
    try{
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB", error);
        process.exit(1);
    }
}
