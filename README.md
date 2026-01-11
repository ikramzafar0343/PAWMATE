# PAWMATE 🐾

**PAWMATE** is a comprehensive Pet Health Management System designed to bridge the gap between Pet Owners and Veterinarians. It provides a seamless interface for managing pet health records, booking appointments, conducting remote consultations, and more.

## 🚀 Features

### 👥 Role-Based Access Control (RBAC)
The platform features three distinct dashboards tailored to specific user roles:
- **Pet Owner**: Manage pets, view medical history, book appointments, consult vets, browse marketplace, and find breeding matches.
- **Veterinarian**: Manage patient records, view appointments, prescribe medicines, and conduct consultations.
- **Admin**: Oversee the entire platform (User management, reports, system analytics).

### 🩺 Telemedicine & Consultation
- **Live Chat**: Real-time messaging with support for text, images, and file attachments.
- **Video & Voice Calls**: Simulated high-quality video and voice call interface.
- **Consultation History**: Access past consultation records and chat logs.

### 📅 Appointment Management
- **Easy Booking**: Intuitive flow for selecting pets, vets, dates, and times.
- **Status Tracking**: Track appointments (Pending, Confirmed, Completed, Cancelled).
- **Dynamic Scheduling**: Real-time availability checks.

### 📋 Medical Records
- **Digital Health Logs**: Vaccination history, surgeries, and chronic conditions.
- **Prescriptions**: Digital access to prescribed medicines and dosage instructions.
- **Pet Profiles**: Detailed profiles for each pet including breed, age, and weight.

### 🛒 Marketplace & Services
- **Pet Marketplace**: Buy and sell pets or pet products.
- **Breeding Match Finder**: Find suitable breeding matches for your pets based on breed and location.
- **AI Disease Detection**: Upload pet images for preliminary AI-based disease analysis (Simulated/Integrated).

### 💻 Dashboard & UI
- **Responsive Design**: Fully responsive layout built with Tailwind CSS.
- **Interactive Components**: Dynamic charts, data tables, and modal interactions.
- **Modern Aesthetics**: Clean, user-friendly interface with consistent styling and React Icons.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React.js](https://reactjs.org/) (Vite)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router DOM](https://reactrouter.com/)
- **State Management**: React Hooks & Context API.
- **HTTP Client**: Axios.

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **Authentication**: JSON Web Tokens (JWT)
- **Image Uploads**: Cloudinary (integrated via API)

## 📂 Project Structure

```
PAWMATE/
├── backend/               # Node.js/Express Backend
│   ├── config/            # Database configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Auth & Error middleware
│   ├── models/            # Mongoose models (User, Pet, etc.)
│   ├── routes/            # API routes
│   └── server.js          # Entry point
├── src/                   # React Frontend
│   ├── api/               # Axios setup
│   ├── components/        # Reusable UI components
│   ├── pages/             # Main route pages
│   ├── utils/             # Helper functions and stores
│   └── App.jsx            # Main application entry
└── ...
```

## ⚡ Getting Started

### Prerequisites
- Node.js installed on your machine.
- MongoDB Atlas account (free tier available) or local MongoDB installation.

### 1. MongoDB Atlas Setup (Recommended)

1. **Create MongoDB Atlas Account**
   - Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account (M0 Free Tier available)

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose "M0 FREE" (Free Tier)
   - Select a cloud provider and region (choose closest to you)
   - Click "Create"

3. **Create Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter username and password (save these!)
   - Set user privileges to "Atlas admin" or "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add specific IP addresses
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `pawmate` (or your preferred database name)
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/pawmate?retryWrites=true&w=majority`
   
venv\Scripts\activate
### 2. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Install backend dependencies:
    ```bash
    npm install
    ```

3.  Create a `.env` file in the `backend/` directory:
    ```env
    PORT=5000
    NODE_ENV=development
    
    # MongoDB Atlas Connection String (REQUIRED)
    MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pawmate?retryWrites=true&w=majority
    
    # JWT Secret (change this in production!)
    JWT_SECRET=your_jwt_secret_key_change_in_production
    ```

   **Important:** Replace the `MONGO_URI` with your actual MongoDB Atlas connection string from step 5 above.

4.  Start the backend server:
    ```bash
    npm run server
    ```
    The server should run on `http://localhost:5000`.
    
    You should see:
    ```
    ✅ MongoDB Atlas Connected: cluster0.xxxxx.mongodb.net
    📊 Database: pawmate
    ```

### 3. Local MongoDB (Alternative)

If you prefer to use local MongoDB instead:

1. Install MongoDB locally: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

2. Start MongoDB service

3. Update `.env` file:
   ```env
   MONGO_URI=mongodb://localhost:27017/pawmate
   ```

### 2. Frontend Setup

1.  Open a new terminal and navigate to the root directory (PAWMATE):
    ```bash
    cd ..
    # or ensure you are in the root PAWMATE/ directory
    ```

2.  Install frontend dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm start
    ```

4.  **Open in Browser**
    Visit `http://localhost:5173` to view the application.

## 🔑 Default/Demo Access

- **Register**: You can register a new account as a Pet Owner or Veterinarian on the Sign Up page.
- **Login**: Use your registered credentials to log in.

---
Built with ❤️ by the PAWMATE Team.
