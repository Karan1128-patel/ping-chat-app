import nodemailer from 'nodemailer';
import Msg from './mssages.util.js';
import { smtpConfig, __dirname, LOGO_URL, API_URL } from '../constants.js';
import path from 'path';
import { readFile } from 'fs/promises';
import handlebars from 'handlebars';

const transporter = nodemailer.createTransport({
    host: smtpConfig.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
        user: smtpConfig.EMAIL_USER,
        pass: smtpConfig.EMAIL_PASS,
    },
});

const sendEmail = async (emailOptions) => {
    const mailOptions = {
        from: smtpConfig.EMAIL_USER,
        to: emailOptions.to,
        subject: emailOptions.subject,
        html: emailOptions.html,
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        // throw new Error(Msg.errorToSendingEmail);
    }
};

export const sendOtpVerificationEmail = async ({ email, otp, res }) => {
    try {
        const verificationCode = otp;

        const context = {
            logo: LOGO_URL,
            email_title: Msg.otpVerification,
            title: Msg.confirmYourEmailAddress,
            message: `Your verification code is ${verificationCode}`,
        };

        const emailTemplatePath = path.join(__dirname, 'views', 'mail_template.handlebars');
        const templateSource = await readFile(emailTemplatePath, 'utf-8');
        const template = handlebars.compile(templateSource);
        const emailHtml = template(context);

        const emailOptions = {
            to: email,
            subject: Msg.otpVerification,
            html: emailHtml,
        };

        await sendEmail(emailOptions);

        return {
            success: true,
            message: Msg.forgotPasswordOtpSend,
            code: verificationCode, // ✅ optional return
        };
    } catch (error) {
        console.error('❌ Error in sendVerificationEmail:', error);
        throw new Error(Msg.errorToSendingEmail);
    }
};


export const sendEmailVerificationEmail = async ({ email, verification_token, res }) => {
    try {

        const context = {
            logo: LOGO_URL,
            email_title: Msg.accountActivate,
            title: Msg.confirmYourEmailAddress,
            message: Msg.verificatiionMessage,
            href_url : `${API_URL}public/verify/${verification_token}`,
            buttonText : `Verify`,
        };

        const emailTemplatePath = path.join(__dirname, 'views', 'mail_template.handlebars');
        const templateSource = await readFile(emailTemplatePath, 'utf-8');
        const template = handlebars.compile(templateSource);
        const emailHtml = template(context);

        const emailOptions = {
            to: email,
            subject: Msg.accountActivate,
            html: emailHtml,
        };

        await sendEmail(emailOptions);

        return {
            success: true,
            message: Msg.accountActivate,
        };
    } catch (error) {
        console.error('❌ Error in sendVerificationEmail:', error);
        throw new Error(Msg.errorToSendingEmail);
    }
};

