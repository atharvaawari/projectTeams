# Backend API

A TypeScript-based Node.js backend with Express, MongoDB, and authentication support.

## Features

- 🚀 Express.js web framework
- 🔐 Authentication with Passport (Local & Google OAuth)
- 🛡️ TypeScript for type safety
- 🗄️ MongoDB with Mongoose ODM
- 🔒 Secure password hashing with bcrypt
- 📝 Zod for schema validation
- 🔄 Session management with cookie-session
- ⚙️ Environment configuration with dotenv

## Prerequisites

- Node.js v16+
- npm or yarn
- MongoDB instance (local or cloud)
- Google OAuth credentials (for Google auth)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/backend.git
   cd backend

npm install
# or
yarn install

src/
├── config/         # App configuration
├── controllers/    # Route controllers
├── interfaces/     # Type definitions
├── middlewares/    # Express middlewares
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
├── validations/    # Validation schemas
├── index.ts        # App entry point