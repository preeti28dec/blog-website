# Backend Server

This is the Node.js/Express backend server for the Blog Website.

## Setup

1. Make sure you have a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=mongodb://localhost:27017/blogdb
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   JWT_SECRET=your-secret-key-here
   ```

2. Install dependencies (already done):
   ```bash
   npm install
   ```

3. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

4. Push database schema to MongoDB:
   ```bash
   npm run db:push
   ```

## Running the Server

### Development Mode
Run the backend server only:
```bash
npm run dev:server
```

Run both frontend and backend together:
```bash
npm run dev:all
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ name: string, email: string, password: string }`
  - Returns: `{ message, user, token }`

- `POST /api/auth/login` - Login user
  - Body: `{ email: string, password: string }`
  - Returns: `{ message, user, token }`

- `GET /api/auth/me` - Get current user (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ user }`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. After successful login or registration, a token is returned that should be stored and sent with subsequent requests in the `Authorization` header as `Bearer <token>`.



