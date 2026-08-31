import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = ["MONGO_URI", "PORT", "JWT_SECRET"];

requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        throw new Error(`Environment variable ${envVar} is not set`);
    }
});

export const MONGO_URI = process.env.MONGO_URI;
export const PORT = process.env.PORT;
export const JWT_SECRET = process.env.JWT_SECRET;