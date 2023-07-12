const nodemailer = require("nodemailer");
require('dotenv').config()

const mailSender = async (email, title, body) => {
    try{
        const transporter = createTransporter({
            host: process.env.MAIL_HOST, 
            auth:{
                user: process.env.MAIL_USER,
                password: process.env.MAIL_PASSWORD
            },
        })

        let info = await transporter.sendMail({
            from: "StudyNotion || Tanishq Rinjay",
            to: `${email}`,
            subject:`${title}`,
            title:`${body}`
        })
        console.log(info);
        return info;
    }
    catch(err){
        console.log("Error in sending mail: ", err);
    }
};

module.exports = mailSender;