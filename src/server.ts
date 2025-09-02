import "dotenv/config";
import express from "express";
import routes from "./routes.js";

const app = express();
app.use(express.json());
app.use("/api", routes);

const port = process.env.PORT ?? 3000;
app.listen(port, () => console.log(`AA API running at http://localhost:${port}`));
