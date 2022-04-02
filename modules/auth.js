const sendEmail = require('../helpers/sendMail');
const crypto = require("crypto");
/* Controller - defines all routes */
const User = require('../models/User')
const jwt = require('jsonwebtoken');

exports.register = async (req, res, next) => {
    const { name, email, password } = req.body;
    try {
        const user = await User.create({
            name,
            email,
            password
        })
        return res.status(200).json({
            success: true,
            message: "Registered Successfully"
        })
    } catch (error) {
        return res.status(500).send({
            success: false,
            error: error.message
        })
    }

}

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    /* check if both email and password are given */
    if (!email || !password) {
        return res.status(400).send({
            success: false,
            error: "Please provide both email and password"
        })

    }
    try {
        /* Check if user exists in Database */
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).send({
                success: false,
                error: "Invalid Credentials"
            })
        } else {
            /* Check if entered password matched with the password in DB */
            const isMatch = await user.matchPassword(password);
            console.log(`isMatch ${isMatch}`);

            if (!isMatch) {
                return res.status(400).send({
                    success: false,
                    error: "Invalid Credentials"
                })
            } else {
                /* If matches generate Token */
                const token = await user.getToken();
                return res.status(200).json({
                    success: true,
                    message: "Login Success",
                    token
                })
            }
        }
    } catch (error) {
        res.status(500).send(error)
    }
}

exports.forgotpassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        /* Check if email exists in DB */
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "Email couldn't be sent"
            })
        }
        /* else{ */
        const resetToken = user.getResetPasswordToken();
        await user.save();

        const resetURL = `${process.env.Client_URL}/resetpassword/${resetToken}`

        const message = `
                <h1> You have requested for password reset </h1>
                <p> Please click on the below link to reset your password </p>
                <a href=${resetURL}>${resetURL}</a>
                <h3>Link will be valid only for ${process.env.TOKEN_EXPIRE}</h3>
                <p>${process.env.EMAIL_OWNER}</p>
                
            `
        /* Send Mail */
        try {
            await sendEmail({
                to: user.email,
                subject: process.env.EMAIL_SUBJECT,
                text: message
            })

            res.status(200).send({ success: true, data: "Email Sent! Make sure to check your spam mail and mark not as spam." })
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save();

            return res.status(500).send({
                success: false,
                error: "Email couldn't be sent"
            })
        }
        /*  } */
    } catch (error) {
        return res.status(500).send({
            success: false,
            error: error.message
        })
    }
}

exports.resetpassword = async (req, res, next) => {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.resetToken).digest("hex")

    try{
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });
        if(!user){
            return res.status(400).json({
                success : false,
                error : "Password update failed"
            })
        }
        user.password = req.body.password;
            /* After password reset, reset token values in DB */
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        return res.status(201).json({
            success: true,
            message: "Password Updated Success",
        })
    }catch(error){
        return res.status(500).send(error)
    }
}