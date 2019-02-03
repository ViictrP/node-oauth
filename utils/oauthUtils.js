//FORMAT OF TOKEN
// Authorization: Bearer <access_token>

//VERIFY REQUEST TOKEN
function verifyToken(req, res, next) {
    //Get oauth header
    const bearerHeader = req.headers['authorization'];
    //Check if the bearer is undefined
    if (typeof bearerHeader !== 'undefined') {
        // Split at the space   
        const bearer = bearerHeader.split(' ');
        // Get token from array
        const bearerToken = bearer[1];
        req.token = bearerToken;
        // Next middleware
        next();
    } else {
        // Forbidden
        res.status(403).send('Authentication is required');
    }
}

export default {
    verifyToken: verifyToken
}