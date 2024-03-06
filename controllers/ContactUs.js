const User = require("../models/User");
const mailSender = require("../utils/mailSender");

//TODO: Send mail to User
exports.contactUsMail = async (req, res) => {
    try {
        //Fetching user id from auth token
        // const userId = req.user.id;

        //Fetching data to send from req body
        const { firstName, lastName, email, phoneNumber, message } = req.body;

        // const userDetails = await User.findById(userId).populate(
        //     "additionalDetails"
        // );
        //Creating data to send to Student/Instructor
        companyName = "EduNxt";
        const userMailData = `Hi ${firstName} ${lastName}, 
        Thanks for contacting ${companyName}! This automatic reply is just to let you know that we received your message and we'll get back to you with a response as quickly as possible.`;
        const userMailTitle = "EduNxt - Contact Forum";
        await mailSender(email, userMailTitle, userMailData);

        //Creating data to send to EduNxt Manager, yaani ki main
        const managerMailTitle = "EduNxt - Contact Us Forum recieved";
        const managerMailData = `From: ${firstName} ${lastName} <br>
        Email: (${email}) <br>
        Phone No. : ${phoneNumber} <br>
        message: ${message}`;
        const managerMailId = "tanishqbaranwal@gmail.com";

        //Sending mail to EduNxt manager
        await mailSender(managerMailId, managerMailTitle, managerMailData);

        //Success response
        return res.status(200).json({
            success: true,
            message: "Mail sent successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to send mail, server error",
            error: err.message,
        });
    }
};
