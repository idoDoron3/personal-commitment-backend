const axios = require('axios');

const SERVICES = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    // future services
    // lesson: process.env.LESSON_SERVICE_URL || 'http://localhost:3002',
    
};

exports.forwardRequest = async (req, res, service, endpoint) => {
    try {
        console.log("start request from auth servic")
        console.log('Final URL:', `${SERVICES[service]}/auth${endpoint}`);
        console.log('Request body:', req.body);  // בדיקה של גוף הבקשה


        const response = await axios({
            method: req.method,
            url: `${SERVICES[service]}/auth${endpoint}`, 
            data: req.body,
            headers: {
                'Content-Type': 'application/json'
            },
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
