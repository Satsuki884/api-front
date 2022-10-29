import jsonwebtoken from 'jsonwebtoken';
import { parseJwt}  from '../../data/utils/jsonwebtoken.js';

const confirm_token = (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers['token'];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  jsonwebtoken.verify(token, process.env.TOKEN_KEY);
    const object = parseJwt(token).object;
    req.user = object;
  return next();
};

export default confirm_token;

