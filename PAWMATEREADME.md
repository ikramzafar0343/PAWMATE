# PAWMATE

## 1. Project Overview

PAWMATE is a client–server web application for pet care management. It enables pet owners to book consultations with veterinarians, manage appointments and medical records, receive AI-assisted disease predictions, and explore a marketplace for pet-related listings. Veterinarians manage availability, consultations, prescriptions, and profile settings. Admins oversee system analytics and user management.

- **Core features**
  - User authentication and role-based dashboards (Owner, Vet, Admin)
  - Appointment booking, consultation history, and vet availability
  - Medical records management and prescription handling
  - AI disease detection with Python integration and caching
  - Marketplace listings (add/view)
  - Image/file uploads via Cloudinary
  - Admin stats and system analytics (Simplified interface focused on User Management)
- **Target users**
  - Pet owners seeking veterinary services
  - Veterinarians providing online/clinic consultations
  - Admins maintaining the platform and user base

## 2. Architecture

- **Pattern**: Client–Server monolith with MVC-like backend layering
  - Frontend: React + Vite single-page application
  - Backend: Express server exposing REST APIs
  - Database: MongoDB Atlas using Mongoose models
  - Caching: In-memory cache (optional)
- **Communication**
  - Frontend consumes backend REST APIs via Axios with JWT Authorization headers
  - Backend controllers perform business logic, use Mongoose for persistence, and optionally cache read-heavy endpoints with Redis and ETag headers
- **Fit rationale**
  - A monolithic architecture simplifies deployment and development for a feature-rich product; MVC separation in controllers/models/middleware supports maintainability; SPA frontend provides responsive UX for booking and records
- **Textual flow**
  - Browser (React) → Axios → Express Routes → Controllers → Mongoose → MongoDB
  - Controllers → Cache layer (Redis/in-memory) → Response (ETag/compressed) → Frontend

Key references:
- Server boot and middleware: [server.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/server.js)
- Route mounts: [server.js: route mounts](file:///c:/Users/HP/Desktop/PAWMATE/backend/server.js#L73-L110)
- Axios client: [client.js](file:///c:/Users/HP/Desktop/PAWMATE/src/api/client.js)

## 3. OOP Concepts

While the project primarily uses functional modules, several OOP principles appear in the code design:

- **Encapsulation**
  - Controllers encapsulate request handling logic and compose data access
    ```javascript
    // backend/controllers/appointmentController.js
    const cached = await cacheService.get(cacheKey);
    if (cached) { res.set('ETag', cachedEtag); return res.status(200).json(cached); }
    let appointments = await Appointment.find(matchQuery).select(selectFields).sort({ date: 1, time: 1 }).lean();
    ```
  - Cache utilities encapsulate memory cache interactions
    - [cacheService.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/utils/cacheService.js)
    - [cache.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/utils/cache.js)
- **Abstraction**
  - Axios client abstracts API base URL and token attachment
    ```javascript
    // src/api/client.js
    const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
    API.interceptors.request.use((req) => {
      const token = localStorage.getItem('token');
      if (token) req.headers.Authorization = `Bearer ${token}`;
      return req;
    });
    ```
  - Database connection abstracts MongoDB Atlas setup and index management
    ```javascript
    // backend/config/db.js
    await mongoose.connect(mongoUri, { maxPoolSize: 50, minPoolSize: 10, tls: true });
    await collections.appointments.createIndex({ ownerId: 1, date: 1, time: 1 }, { background: true });
    ```
- **Polymorphism**
  - Role-based middleware applies different behavior based on user role (admin/vet/owner)
    ```javascript
    // backend/middleware/authMiddleware.js
    const admin = (req, res, next) =>
      req.user?.role === 'admin' ? next() : res.status(401).send('Not authorized as an admin');
    const vet = (req, res, next) =>
      (req.user?.role === 'vet' || req.user?.role === 'admin') ? next() : res.status(401).send('Not authorized as a veterinarian');
    ```
- **Inheritance**
  - Classic inheritance is not heavily used; the project favors composition within modules and Mongoose schemas. Schema discrimination is not present; relations are handled via references.

## 4. Scalability

- **Current support**
  - Stateless REST APIs suitable for horizontal scaling
  - In-memory caching with TTL and ETags reduces load on MongoDB
  - PM2 clustering configuration for multi-process Node instances
  - MongoDB Atlas indexes for read performance
- **Patterns/techniques**
  - Caching: Redis and in-memory fallback; ETag-based conditional responses
  - Database indexing: Appointments, Listings indexes set at startup
  - Rate limiting on API prefix to mitigate abuse
  - Compression and profiling to optimize response payloads
- **Limitations**
  - No centralized config for cache keys across modules
  - Limited test coverage; no automated performance regression tests
  - Not containerized (Docker) out of the box; CI/CD not defined
  - WebSocket real-time channels not implemented for consultations/messages (HTTP-based)

References:
- PM2 config: [ecosystem.config.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/ecosystem.config.js)
- Rate limit/compression: [server.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/server.js#L41-L90)
- Indexes: [db.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/config/db.js)

## 5. Technologies Used

| Layer      | Technologies |
|-----------|--------------|
| Frontend  | React, Vite, React Router DOM, Axios, Tailwind CSS, React Icons, jsPDF |
| Backend   | Node.js, Express, Mongoose, Multer, Cloudinary SDK |
| Database  | MongoDB Atlas |
| Dev/Build | Vite, ESLint, PostCSS, Tailwind |
| Deploy    | Render (render.yaml), PM2 (ecosystem config), Compression, Rate limiting |
| AI        | Python (Pillow, NumPy), TensorFlow (optional) |

Key files:
- Frontend packages: [package.json](file:///c:/Users/HP/Desktop/PAWMATE/package.json)
- Backend packages: [backend/package.json](file:///c:/Users/HP/Desktop/PAWMATE/backend/package.json)
- Vite config: [vite.config.js](file:///c:/Users/HP/Desktop/PAWMATE/vite.config.js)
- Tailwind config: [tailwind.config.js](file:///c:/Users/HP/Desktop/PAWMATE/tailwind.config.js)
- AI Requirements: [requirements.txt](file:///c:/Users/HP/Desktop/PAWMATE/requirements.txt)
- Render Config: [render.yaml](file:///c:/Users/HP/Desktop/PAWMATE/render.yaml)

## 6. Database Structure

- **Type**: NoSQL (MongoDB Atlas)
- **Models/Collections**
  - Users: roles (owner/vet/admin), profile, status; vet fields include specialization, clinicName, availability, and consultationFees
    - [User.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/User.js)
  - Pets: owner relationship and pet attributes
    - [Pet.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Pet.js)
  - Appointments: references to ownerId, vetId, petId; date/time; type; status
    - [Appointment.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Appointment.js)
  - Medical Records: associated with pet and owner/vet
    - [MedicalRecord.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/MedicalRecord.js)
  - Prescriptions/Medicines: prescription issuance and medicine metadata
    - [Prescription.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Prescription.js), [Medicine.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Medicine.js)
  - Listings: marketplace entities with statuses and timestamps
    - [Listing.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Listing.js)
  - Messages/Activities: audit/message trails
    - [Message.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Message.js), [Activity.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Activity.js)
  - Predictions: AI output storage
    - [Prediction.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Prediction.js)
- **Indexes**
  - Appointments: `{ ownerId: 1, date: 1, time: 1 }`
  - Listings: `{ status: 1, createdAt: -1 }`
  - Created at startup: [db.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/config/db.js#L56-L79)
- **Data flow**
  - Controllers query/update models via Mongoose; selected endpoints may leverage in-memory caching and ETag to optimize repeated reads; frontend stores/utilities call APIs via Axios

## 7. API Integration

- **Internal APIs**
  - Auth: login/register/me — [authRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/authRoutes.js), [authController.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/controllers/authController.js)
  - Users: vets listing, CRUD, admin stats — [userRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/userRoutes.js)
  - Pets, Appointments, Consultations, Medical Records, Prescriptions, Medicines, Listings, Reports, Messages, Activities, Uploads, Predictions — all routed in [server.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/server.js#L73-L110) via dedicated route files
- **Frontend consumption**
  - Axios client with request/response interceptors attached; utilities under `src/utils/*` wrap endpoint calls (e.g., `vetStore`, `appointmentStore`, `medicalRecordStore`, `marketplaceStore`, `pdfGenerator`, etc.)
  - Example: vets browsing uses `/api/users/vets` public endpoint — [userRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/userRoutes.js#L18-L29)
- **External services**
  - Cloudinary for file/image uploads
  - Optional Python script for AI predictions (mock fallback if absent)
- **Authentication flow**
  - Client logs in, receives JWT, stores token in localStorage
  - Axios attaches `Authorization: Bearer <token>` header per request
  - Backend `protect` middleware validates token and attaches user to request
  - Role guards: `admin`, `vet` middleware enforce endpoint access policies

## 8. Security Features

- **Authentication**: JWT-based (`protect` middleware), token validation via `jwt.verify`
  - [authMiddleware.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/middleware/authMiddleware.js#L37-L89)
- **Authorization**: role-based guards for admin and veterinarians
- **Admin Protection**: Admin accounts are protected from deletion; role modification is restricted.
- **Password hashing**: handled in `User` model with Mongoose pre-save/hooks (see model implementation)
- **Environment variables**:
  - `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, `CLOUDINARY_*`, `CACHE_ENABLED`
  - Loaded via process.env; sensitive values not hard-coded
- **Protections**
  - Rate limiting middleware on `/api/`
  - CORS configured for frontend URL
  - JSON body size limits
  - Response compression
  - ETag caching to reduce payload/responses for unchanged resources
- **Validation**
  - Mongoose schema-level validation; request-level validation minimal (can be improved with JOI/Celebrate)

References:
- Server security middleware: [server.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/server.js#L41-L90)
- Auth controller/middleware: [authController.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/controllers/authController.js), [authMiddleware.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/middleware/authMiddleware.js)

## 9. Performance Optimization

- **Caching**
  - In-memory cache with TTL and ETag support for read-heavy endpoints (Appointments, Predictions)
- **API optimizations**
  - Lean queries for read operations
  - Field selection (`select`) to reduce payload size
  - Sorting/index usage for deterministic responses
  - Request deduplication and client-side caching in some utils (e.g., `vetStore`)
- **Database optimizations**
  - Startup index creation for critical collections
  - Atlas connection pool tuning
- **Frontend optimizations**
  - Vite build, Tailwind tree-shaking
  - Axios request consolidation via utilities (stores)
- **Load balancing readiness**
  - PM2 clustering enabled via ecosystem configuration

References:
- Appointment caching: [appointmentController.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/controllers/appointmentController.js#L54-L91)
- Prediction caching: [predictionController.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/controllers/predictionController.js#L311-L334)
- Cache service: [cacheService.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/utils/cacheService.js)
- In-memory helpers: [cache.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/utils/cache.js)

## 10. Testing

- **Automated tests**
  - No formal unit/integration/e2e test suites present
  - Backend `test` script is placeholder
- **Performance benchmarking**
  - Benchmark runner and documentation available
    - [backend/benchmark.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/benchmark.js)
    - [BENCHMARK_README.md](file:///c:/Users/HP/Desktop/PAWMATE/backend/BENCHMARK_README.md)
- **How to run tests**
  - Tests not implemented; add Jest/Mocha for backend and Vitest/RTL for frontend

## 11. Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account/cluster
- Cloudinary account (for image uploads)
- Python 3.8+ (Optional, for local AI features - see `requirements.txt`)

### Environment Variables
Create `.env` files for backend and frontend as needed:

Backend `.env`:
```
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=<change_this_in_production>
FRONTEND_URL=http://localhost:5173
CACHE_ENABLED=true
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
NODE_ENV=development
```

Frontend `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### Install Dependencies
From repository root:
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### Run Locally
Backend:
```bash
cd backend
npm run dev
# Server listens on PORT (default 5000)
```

Frontend:
```bash
npm run dev
# Vite dev server default at http://localhost:5173
```

### Build & Production
Frontend build:
```bash
npm run build
```

Backend with PM2:
```bash
cd backend
pm2 start ecosystem.config.js
```

### Deployment on Render
This project is configured for deployment on [Render](https://render.com) using the `render.yaml` blueprint.

1. Push your code to a GitHub/GitLab repository.
2. In Render Dashboard, click **New +** -> **Blueprint**.
3. Connect your repository. Render will automatically detect `render.yaml`.
4. Render will propose two services:
   - **pawmate-backend**: The Node.js API.
   - **pawmate-frontend**: The React static site.
5. **Environment Variables**:
   - You will be prompted to enter `MONGO_URI`, `JWT_SECRET`, and `CLOUDINARY_*` keys.
   - `VITE_API_URL` is automatically linked.

### Deployment Notes
- See deployment guides: [DEPLOYMENT.md](file:///c:/Users/HP/Desktop/PAWMATE/backend/DEPLOYMENT.md)
- Optimization summary: [OPTIMIZATION_SUMMARY.md](file:///c:/Users/HP/Desktop/PAWMATE/backend/OPTIMIZATION_SUMMARY.md)

## 12. Future Improvements

- **Performance**
  - Expand Redis usage and define consistent cache key strategy across modules
  - Add server-side pagination to list endpoints
  - Introduce HTTP/2 and GZIP/Brotli tuning at the proxy layer
- **Security**
  - Add robust request validation (Joi/Celebrate/Zod)
  - Enforce stricter CORS policies per environment
  - Rotate secrets with a vault solution; remove fallback secrets
- **Scalability**
  - Containerize with Docker and orchestrate via Kubernetes
  - Use CDN and object storage for static assets
  - Add WebSockets for real-time consultations/messages
- **Code Quality**
  - Add comprehensive unit/integration/e2e tests
  - Enable TypeScript for models/controllers and React components
  - Introduce lint-staged/husky pre-commit checks
- **Features**
  - Payment gateway integration (card/wallet)
  - Rich consultation features (chat, attachments, live video)
  - Owner notifications and reminders (email/SMS/push)

---

## References

- Frontend entry: [main.jsx](file:///c:/Users/HP/Desktop/PAWMATE/src/main.jsx), [App.jsx](file:///c:/Users/HP/Desktop/PAWMATE/src/App.jsx)
- Backend entry: [server.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/server.js)
- Axios client: [client.js](file:///c:/Users/HP/Desktop/PAWMATE/src/api/client.js)
- Database connection: [db.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/config/db.js)
- Models: [User.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/User.js), [Pet.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Pet.js), [Appointment.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Appointment.js), [MedicalRecord.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/MedicalRecord.js), [Listing.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Listing.js), [Medicine.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Medicine.js), [Prescription.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Prescription.js), [Message.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Message.js), [Activity.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Activity.js), [Prediction.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/models/Prediction.js)
- Routes: [authRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/authRoutes.js), [userRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/userRoutes.js), [appointmentRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/appointmentRoutes.js), [consultationRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/consultationRoutes.js), [medicalRecordRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/medicalRecordRoutes.js), [prescriptionRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/prescriptionRoutes.js), [medicineRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/medicineRoutes.js), [listingRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/listingRoutes.js), [reportRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/reportRoutes.js), [messageRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/messageRoutes.js), [activityRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/activityRoutes.js), [uploadRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/uploadRoutes.js), [predictionRoutes.js](file:///c:/Users/HP/Desktop/PAWMATE/backend/routes/predictionRoutes.js)
