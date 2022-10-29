import dotenv from "dotenv";
dotenv.config();

function parseJwt(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}


export   { parseJwt};

