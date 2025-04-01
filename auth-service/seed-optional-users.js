const mongoose = require("mongoose");
const dotenv = require("dotenv");
const OptionalUser = require("./models/optional-users"); // Update path if needed

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB");

    const optionalUsers = [
      {
        first_name: "יוסי",
        last_name: "כהן",
        email: "yossi@example.com",
        role: "student",
      },
      {
        first_name: "דנה",
        last_name: "לוי",
        email: "dana@example.com",
        role: "mentor",
        subjects: ["מתמטיקה", "אנגלית"],
      },
      {
        first_name: "אביגיל",
        last_name: "פרץ",
        email: "avigail@example.com",
        role: "admin",
      },
      {
        first_name: "מיכאל",
        last_name: "ברקוביץ",
        email: "michael@example.com",
        role: "mentor",
        subjects: ["פיזיקה", "כימיה"],
      },
      {
        first_name: "טל",
        last_name: "אלון",
        email: "tal@example.com",
        role: "student",
      },
      {
        first_name: "רותם",
        last_name: "ישראלי",
        email: "rotam@example.com",
        role: "mentor",
        subjects: ["ביולוגיה"],
      },
      {
        first_name: "לירון",
        last_name: "ברזילי",
        email: "liron@example.com",
        role: "mentor",
        subjects: ["מתמטיקה", "פיזיקה", "היסטוריה"],
      },
      {
        first_name: "עידו",
        last_name: "שמעוני",
        email: "ido@example.com",
        role: "student",
      },
      {
        first_name: "תמר",
        last_name: "כהן",
        email: "tamar@example.com",
        role: "mentor",
        subjects: ["אנגלית"],
      },
      {
        first_name: "נועם",
        last_name: "קפלן",
        email: "noam@example.com",
        role: "student",
      },
    ];

    try {
      await OptionalUser.deleteMany({});
      await OptionalUser.insertMany(optionalUsers);
      console.log("Dummy optional users inserted successfully.");
    } catch (err) {
      console.error("Error inserting dummy optional users:", err);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
