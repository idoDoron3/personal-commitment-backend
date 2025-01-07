const axios = require('axios');

const SERVICES = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    // future services
    // lesson: process.env.LESSON_SERVICE_URL || 'http://localhost:3002',
    
};
const publicRoutes = new Set(['/register', '/login', '/refresh']);


exports.forwardRequest = async (req, res, service, endpoint) => {
    try {
        const isPublicRoute = publicRoutes.has(endpoint);

        let headers = {
            'Content-Type': 'application/json',
        };
        if (!isPublicRoute) {
            const { authorization } = req.headers;
            if (!authorization) {
                return res.status(401).json({ error: 'Authorization header is missing' });
            }
            const token = authorization.split(' ')[1]; // "Bearer <token>"

            if (!token) {
                return res.status(401).json({ error: 'Token not found' });
            }
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await axios({
            method: req.method,
            url: `${SERVICES[service]}/auth${endpoint}`, 
            data: req.body,
            headers: headers,
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
