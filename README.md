# Personal Commitment Backend

This repository hosts the backend of the **Personal Commitment Application**, designed to facilitate matching between students as tutors and mentees. The backend currently supports user authentication and authorization.

---

## Table of Contents

1. [About the Project](#about-the-project)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Running the Project](#running-the-project)
5. [File Structure](#file-structure)
6. [License](#license)

---

## About the Project

The **Personal Commitment Backend** is the server-side component of a platform aimed at managing personal tutoring sessions efficiently. It currently includes:

- Authentication and role-based access control (RBAC).

---

## Features

- **User Authentication**:
  - Secure registration and login using JWT.
  - Role-based permissions for mentors, mentees, and administrators.

---

## Technologies Used

- **Node.js**: Runtime environment.
- **Express.js**: Web framework for building APIs.
- **Sequelize**: ORM for MySQL database operations.
- **MySQL**: Relational database for storing application data.
- **JWT**: Authentication using JSON Web Tokens.

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v14 or later)
- [MySQL](https://www.mysql.com/) (or access to a MySQL-compatible database)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/idoDoron3/personal-commitment-backend.git
   ```

2. Navigate to the project directory:

   ```bash
   cd personal-commitment-backend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Configure environment variables:

   Create a `.env` file in the root directory and add the following:

   ```plaintext
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=personal_commitment_db
   DB_USER=root
   DB_PASSWORD=your_password
   JWT_SECRET=your_jwt_secret
   SMTP_HOST=smtp.your-email.com
   SMTP_PORT=587
   SMTP_USER=your_email
   SMTP_PASSWORD=your_password
   ```

### Running the Project

To start the project, you need to run the following services simultaneously:

1. Start the `gateway` service:

   ```bash
   cd gateway
   npm start
   ```

   Once the `gateway` service is running, you can access the Swagger documentation. The terminal will display a URL for the Swagger UI, typically something like:

   ```plaintext
   http://localhost:3000/api-docs
   ```

   Open this link in your browser to explore and test the available APIs.

2. Start the `auth-service`:

   ```bash
   cd auth-service
   npm start
   ```

---

## File Structure

```plaintext
personal-commitment-backend/
├── auth-service/       # Handles user authentication and authorization
├── gateway/            # API Gateway for routing requests
├── models/             # Sequelize models
├── seeders/            # Seed data for initial setup
├── package.json        # Project dependencies
└── README.md           # Project documentation
```

---

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
