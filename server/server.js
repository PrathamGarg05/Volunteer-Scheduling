import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { PORT } from "./src/config/env.js";

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Error connecting to MongoDB", error);
    process.exit(1);
});