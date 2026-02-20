import axios from "axios";

export const sendInfobipSms = async (to, message) => {
    const url = `${process.env.INFOBIP_BASE_URL}/sms/2/text/advanced`;
    const payload = {
        messages: [{ from: process.env.INFOBIP_SENDER, destinations: [{ to }], text: message }]
    };
    await axios.post(url, payload, {
        headers: {
            Authorization: process.env.INFOBIP_API_KEY,
            "Content-Type": "application/json",
            Accept: "application/json"
        }
    });

    return true;
};
