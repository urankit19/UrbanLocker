# UrbanLocker 🧳
### Smart Luggage Storage & Booking Platform

UrbanLocker is a full-stack web application designed to simplify luggage storage for travelers. It helps users discover storage locations near railway stations, airports, and tourist destinations, while providing administrators with tools to manage locations, lockers, pricing, and bookings.


---

## 🌐 Live Application

- **Frontend:** [UrbanLocker](https://urbanlocker1.onrender.com)
- **Backend API:** [UrbanLocker Backend](https://urbanlocker-backend.onrender.com)
- **Locations API:** [View Storage Locations](https://urbanlocker-backend.onrender.com/api/locations)

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Application Workflow](#-application-workflow)
- [Installation and Setup](#-installation-and-setup)
- [Environment Variables](#-environment-variables)
- [Running Locally](#-running-locally)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Security](#-security)
- [Future Improvements](#-future-improvements)
- [Author](#-author)

## 🚀 About the Project

Travelers often need a convenient place to store their bags while exploring a city, visiting attractions, or waiting for transportation.

UrbanLocker provides a centralized platform for managing luggage storage locations and lockers. Users can explore available locations and use the application's booking workflow, while administrators can manage storage facilities through a dedicated dashboard.

The application follows a client-server architecture, with a React frontend communicating with a REST API built using Node.js and Express.js. MongoDB stores application data, and Razorpay is integrated for payment processing.

## ✨ Features

### 👤 User Features

- User registration and login.
- Browse luggage storage locations.
- Discover locations near railway stations, airports, and tourist destinations.
- View locker information and configured pricing.
- Book lockers through the booking workflow.
- Access account and booking-related functionality.

### 🛠️ Admin Dashboard

- Create, view, update, and delete storage locations.
- Manage lockers associated with individual locations.
- Assign locker IDs and configure locker sizes.
- Set hourly and daily locker prices.
- View total and available locker counts.
- View and manage customer bookings.
- Access administrator profile information.

### 📍 Location Management

Each location can contain:

- Name and location category.
- Address, city, state, and country.
- PIN code and geographic coordinates.
- Description and active status.
- Locker inventory information.

### 🔐 Authentication and Payments

- JWT-based authentication.
- Role-based administrative access.
- REST API integration.
- Razorpay payment workflow.
- Backend-based data management.

> Availability, access control, booking validation, and payment confirmation depend on the corresponding backend implementation and configuration.

## 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Vite | Frontend development and build tooling |
| JavaScript | Application logic |
| CSS | Styling and responsive layouts |
| Node.js | Backend runtime |
| Express.js | REST API and routing |
| MongoDB Atlas | Cloud database |
| Mongoose | MongoDB object modeling |
| Axios | HTTP requests |
| JWT | Authentication |
| Razorpay | Payment integration |
| Git & GitHub | Version control |
| Render | Application deployment |

## 📂 Project Structure

```text
UrbanLocker/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── assets/
│   │   └── ...
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
```

*The structure above is illustrative. Folder and file names may vary according to the actual repository.*

## 🔄 Application Workflow

1. Users open the UrbanLocker website.
2. Users browse available storage locations.
3. They explore lockers and configured pricing.
4. Users authenticate when required.
5. They proceed through the booking and payment workflow.
6. The backend processes requests and interacts with MongoDB.
7. Administrators manage locations, lockers, and bookings through the dashboard.

## ⚙️ Installation and Setup

### Prerequisites

Install the following:

- [Node.js](https://nodejs.org/)
- npm
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Git](https://git-scm.com/)
- A code editor such as Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/urankit19/UrbanLocker.git
cd UrbanLocker
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

Open another terminal from the project root:

```bash
cd frontend
npm install
```

## 🔑 Environment Variables

### Backend

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Replace all placeholder values with your own credentials.

### Frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

For the deployed frontend, configure this environment variable in Render:

```env
VITE_API_URL=https://urbanlocker-backend.onrender.com/api
```

**Important:** Never commit `.env` files or expose database credentials, JWT secrets, or private payment keys in frontend code.

## ▶️ Running Locally

### Start the Backend

```bash
cd backend
npm run dev
```

If the development script is unavailable, use:

```bash
npm start
```

Backend URL:

```text
http://localhost:5000
```

### Start the Frontend

In a separate terminal:

```bash
cd frontend
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

## 🔌 API Endpoints

The backend is organized into REST API route groups.

| Endpoint Prefix | Description |
|---|---|
| `/api/auth` | Authentication and user-related operations |
| `/api/locations` | Location management |
| `/api/lockers` | Locker management |
| `/api/bookings` | Booking operations |
| `/api/payments` | Payment operations |

### Example: Retrieve Locations

```http
GET /api/locations
```

Live example:

[https://urbanlocker-backend.onrender.com/api/locations](https://urbanlocker-backend.onrender.com/api/locations)

The exact request methods, authorization requirements, request bodies, and response formats are defined by the implemented backend routes.

## ☁️ Deployment

UrbanLocker is deployed using Render, with MongoDB Atlas used for database hosting.

### Backend Deployment

1. Connect the GitHub repository to a Render Web Service.
2. Set the root directory to `backend`.
3. Configure the build command and start command.
4. Add the required environment variables.
5. Configure MongoDB Atlas network access.
6. Deploy and test the API.

### Frontend Deployment

1. Create a Render Static Site connected to the repository.
2. Set the root directory to `frontend`.
3. Configure the build command:

   ```bash
   npm install && npm run build
   ```

4. Set the publish directory to `dist`.
5. Configure `VITE_API_URL` with the deployed backend URL.
6. Configure a fallback rewrite from `/*` to `/index.html` for React Router routes.
7. Deploy and test the website.

## 🔒 Security

- Keep sensitive credentials in environment variables.
- Never commit secrets to GitHub.
- Validate input on the backend.
- Protect administrative operations with server-side authorization.
- Verify payment results on the server before confirming paid bookings.
- Prevent overlapping bookings for the same locker and time slot.
- Handle cancellations and expired bookings consistently.
- Configure database access and CORS appropriately for production.

## 🔮 Future Improvements

- Interactive maps and location-based search.
- Advanced location and locker filters.
- Real-time availability updates.
- Booking QR codes and digital receipts.
- Automated booking expiry and notifications.
- Customer reviews and ratings.
- Administrative analytics and reporting.
- Automated testing and continuous integration.

## 👨‍💻 Author

**Ankit Raj**

B.Tech — Computer Science and Engineering

- GitHub: [@urankit19](https://github.com/urankit19)

---

## 📄 License

No license has been specified yet. Add a `LICENSE` file if you intend to distribute this project under an open-source license.

---

<p align="center">
  <strong>UrbanLocker — Your Journey, Without the Baggage.</strong>
</p>
