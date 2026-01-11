# PAWMATE Setup Instructions

## Quick Start Guide

### 1. Backend Setup

#### Option A: Using Local MongoDB

1. **Install MongoDB** (if not already installed):
   - Download from: https://www.mongodb.com/try/download/community
   - Or use MongoDB via Docker: `docker run -d -p 27017:27017 mongo`

2. **Start MongoDB**:
   ```bash
   # Windows (if installed as service, it should auto-start)
   # Or use MongoDB Compass to start it
   
   # Linux/Mac
   sudo systemctl start mongod
   # or
   mongod
   ```

3. **Seed the database**:
   ```bash
   cd backend
   npm run seed
   ```

#### Option B: Using MongoDB Atlas (Cloud)

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and get your connection string
3. Update `backend/.env`:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pawmate
   ```
4. Run seed:
   ```bash
   cd backend
   npm run seed
   ```

#### Option C: In-Memory Database (Development Only)

The server will automatically use in-memory database if MongoDB is not available. **Note: Data will be lost when server restarts.**

### 2. Start Backend Server

```bash
cd backend
npm install  # If not already done
npm run server
```

The server should start on `http://localhost:5000`

### 3. Start Frontend

```bash
# From project root
npm install  # If not already done
npm run dev
```

The frontend should start on `http://localhost:5173`

### 4. Login Credentials

After running the seed script, use these credentials:

- **Pet Owner**: 
  - Email: `owner@pawmate.com`
  - Password: `password123`

- **Veterinarian**: 
  - Email: `vet@pawmate.com`
  - Password: `password123`

- **Admin**: 
  - Email: `admin@pawmate.com`
  - Password: `password123`

## Troubleshooting

### MongoDB Connection Issues

If you see `ECONNREFUSED` error:

1. **Check if MongoDB is running**:
   ```bash
   # Windows
   Get-Service MongoDB
   
   # Linux/Mac
   sudo systemctl status mongod
   ```

2. **Start MongoDB**:
   ```bash
   # Windows (if installed as service)
   Start-Service MongoDB
   
   # Linux/Mac
   sudo systemctl start mongod
   ```

3. **Or use MongoDB Atlas** (cloud) - update `.env` with your connection string

### 401 Unauthorized Errors

- Make sure you've logged in first
- Check that the backend server is running
- Verify JWT_SECRET is set in `backend/.env`

### 400 Bad Request on Login

- Make sure you've run the seed script: `cd backend && npm run seed`
- Verify the user exists in the database
- Check backend server console for detailed error messages

## Environment Variables

### Backend (.env in `backend/` folder)

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/pawmate
JWT_SECRET=your_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env in project root - optional)

```env
VITE_API_URL=http://localhost:5000/api
```

