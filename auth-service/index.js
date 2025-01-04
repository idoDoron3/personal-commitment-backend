const express = require("express");
const sequelize = require("./config/db");
const app = express();
const PORT = process.env.SERVER_PORT || 3001;
const routs = require("./routes/authRoute");

require("dotenv").config(); // reload data from env file

app.use(express.json());
app.use("/auth", routs);
(async () => {
  try {
    await sequelize.sync();
    console.log("Database synced successfully!");

    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
})();
