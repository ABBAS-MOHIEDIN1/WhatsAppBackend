import jwt from "jsonwebtoken";

const secretKey = 'servertvp239cvdasd2';

const verifyToken = (req, res, next) => {
    // Extract the token from the Authorization header
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
        return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    // Check if the header format is 'Bearer <token>'
    const tokenMatch = authorizationHeader.match(/^Bearer (.+)$/);

    if (!tokenMatch || !tokenMatch[1]) {
        return res.status(401).json({ error: 'Unauthorized - Invalid token format' });
    }

    const token = tokenMatch[1];

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized - Invalid token' });
        }

        // Add the decoded user information to the request object
        req.user = decoded;
        next();
    });
};

export { verifyToken };