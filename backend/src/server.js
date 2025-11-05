import "dotenv/config";
import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api", apiRouter);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
