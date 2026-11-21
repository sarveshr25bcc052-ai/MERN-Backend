# Life Care Hospital Backend (Express + MongoDB)

## Requirements
- Node.js 18 or newer
- MongoDB running locally OR a MongoDB Atlas connection URI

## Setup
1. Open this `backend` folder in VS Code terminal.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and edit values.
4. Set `MONGODB_URI` to your MongoDB connection string.
5. Set a long random `JWT_SECRET`.
6. Run `npm run dev`.

The API will run at `http://localhost:5000`.

## Routes
- `GET /api/health` — health check
- `POST /api/auth/register` — signup `{name,email,password}`
- `POST /api/auth/login` — login `{email,password}`
- `GET /api/auth/me` — authenticated profile (Bearer token)
- `POST /api/appointments` — create appointment `{patientName,email,phone,department,doctor,date,time,message}`
- `GET /api/appointments` — admin-only appointment list
- `PATCH /api/appointments/:id/status` — admin-only status `{status:"pending|confirmed|cancelled"}`
- `POST /api/contact` — contact form `{name,email,subject,message}`
- `GET /api/contact` — admin-only contact messages
- `GET /api/patients` — admin-only registered patients

## Admin role
The email set in `ADMIN_EMAIL` is assigned the admin role when registering. Register that email only for the hospital administrator. Do not publish your `.env` file or commit it to source control.


## Frontend
From your React frontend, call the API using `http://localhost:5000`. Example:
```js
const response = await fetch('http://localhost:5000/api/appointments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ patientName, email, phone, department, doctor, date, time, message })
});
const data = await response.json();
```
This is a learning/demo backend, not a production hospital system. Before real patient use, add rate limiting, input validation, secure deployment, backups, audit logging, access controls, and a privacy/security review.
