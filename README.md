# Developer Portfolio Admin Dashboard

Full-stack starter using React + Flask + SQLite with a dark admin UI.

## Requirements
- Python 3.10+
- Node.js 18+

## 1. Run Flask backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
flask --app app run --debug
```
On macOS/Linux, use `cp .env.example .env` instead of `copy`.
Backend: http://127.0.0.1:5000

Default admin (development only):
- Email: `admin@example.com`
- Password: `ChangeMe123!`

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SECRET_KEY` in `backend/.env` before first run. Change the sample credentials before exposing the app publicly. The first admin is created automatically if no admin exists.

## 2. Run React frontend
Open a second terminal:
```bash
cd frontend
npm install
npm start
```
Frontend: http://localhost:3000

If your existing React project was created with Vite, these components can be adapted, but this starter uses Create React App conventions.

## API
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST /api/projects`
- `PUT/DELETE /api/projects/<id>`
- `GET/POST /api/skills`
- `PUT/DELETE /api/skills/<id>`
- `GET /api/messages` (admin)
- `POST /api/messages` (public contact form)
- `PUT/DELETE /api/messages/<id>` (admin)
- `GET/PUT /api/profile`

Protected routes require `Authorization: Bearer <token>`. This is a practical starter, not a substitute for a security review before production deployment.
