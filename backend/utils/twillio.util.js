import twilio from 'twilio';
import { twilio_number, twillio_accountSid, twillio_authToken, twillio_serviceSid } from '../constants.js';
import { ApiError } from './api.util.js';
import { CUSTOM_ERROR } from './message.util.js';

const client = twilio(twillio_accountSid, twillio_authToken);

export const sendOTP = async (mobile_number) => {
  try {
    const verification = await client.verify.v2.services(twillio_serviceSid)
      .verifications
      .create({
        to: mobile_number,
        channel: 'sms',
      });

    console.log('OTP sent via Twilio Verify. SID:', verification.sid);
    return "success"; // or return a status if needed
  } catch (error) {

    const error_codes = {
      60410: "max_attempts",
    }
    if (error.code && error_codes[error.code]) return error_codes[error.code];

    throw new ApiError(CUSTOM_ERROR, 'Failed to send OTP', error, false);
  }
};

export const verifyOTP = async (mobile_number, code) => {
  try {
    const verificationCheck = await client.verify.v2.services(twillio_serviceSid)
      .verificationChecks
      .create({ to: mobile_number, code });

    console.log('Verification check result:', verificationCheck.status);
    return verificationCheck.status;

  } catch (error) {

    const error_codes = {
      60201: "max_attempts",
      60410: "otp_expired",
      20404: "otp_expired",
    }

    if (error.code && error_codes[error.code]) return error_codes[error.code];

    throw new ApiError(CUSTOM_ERROR, 'Failed to verify OTP', error, false);
  }
};
