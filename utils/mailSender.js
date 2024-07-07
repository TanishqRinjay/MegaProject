const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async (email, title, body) => {
    try {
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD,
            },
        });

        let info = await transporter.sendMail({
            from: "EduNxt || Tanishq",
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        });
        console.log(info);
        return info;
    } catch (err) {
        console.log("Error in sending mail: ", err);
    }
};

module.exports = mailSender;
