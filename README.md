# Live Inventory Management System (IMS)

This is a comprehensive, real-time Live Inventory Management System built with the MERN stack (MongoDB, Express, React, Node.js) and enhanced with real-time capabilities via Socket.io and AI features via Google Generative AI.

## Project Structure

The project is divided into two main parts:

- `frontend`: The React application built with Vite, utilizing Bootstrap for styling, Recharts for data visualization, and components for barcode scanning/generation.
- `backend`: The Node.js/Express server that provides the API, connects to MongoDB, and handles real-time WebSockets and AI integration.

## Features

- **Real-time Updates**: Changes to inventory are reflected instantly across all connected clients using Socket.io.
- **Barcode Integration**: Generate and scan barcodes for quick inventory management.
- **AI-Powered Insights**: Utilizes Google Generative AI for smart inventory insights.
- **Secure Authentication**: Uses JWT (JSON Web Tokens) and bcryptjs for secure user authentication.
- **Interactive Dashboard**: Visualize inventory data using Recharts.

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the `backend` directory and add your necessary environment variables (e.g., `PORT`, `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_GEMINI_API_KEY`).
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *The server will start using `nodemon` for automatic restarts on code changes.*

### Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

## Technologies Used

### Frontend
- React 19
- Vite
- React Router DOM
- Bootstrap 5
- Socket.io Client
- Recharts
- HTML5-QRCode
- JSBarcode
- Lucide React

### Backend
- Node.js & Express
- MongoDB & Mongoose
- Socket.io
- JSON Web Token (JWT)
- Bcrypt.js
- Google Generative AI SDK
