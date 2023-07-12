const mongoose = require("mongoose");
require("dotenv");

exports.connect = () => {
    mongoose
        .connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            console.log("Connected to MongoDB");
        })
        .catch((err) => {
            console.log("Can't connect to MongoDB");
            console.log(err);
            process.exit(1);
        });
};
