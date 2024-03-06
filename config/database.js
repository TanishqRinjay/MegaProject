const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () => {
    mongoose
        .connect(process.env.MONGO_URL, {
            dbName: "EduNxt",
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            console.log("Connected to MongoDB");
        })
        .catch((err) => {
            console.log("Can't connect to MongoDB", process.env.MONGO_URL);
            console.log(err);
            process.exit(1);
        });
};
