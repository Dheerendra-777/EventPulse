# EventPulse API

## Start

```powershell
cd backend
npm install
npm start
```

The API listens on `http://localhost:4000` by default. Copy `.env.example` to `.env` and set a strong `JWT_SECRET` for non-development use. The default CORS configuration allows Vite frontends on `http://localhost:5173` and `http://localhost:5174`.

## Environment

```env
PORT=4000
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:5174
JWT_SECRET=replace-with-a-long-random-secret
DATABASE_PATH=./data/eventpulse.db
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback
PASSWORD_RESET_URL=
```

Google sign-in is enabled only when `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` are set. Configure the same redirect URI in the Google Cloud OAuth client. Password reset is enabled only when `PASSWORD_RESET_URL` is set; otherwise the frontend shows a clear not-configured message.

## Development

```powershell
npm run dev
```

The first start creates `data/eventpulse.db` and seeds development accounts and sample event relationships. Set `DATABASE_PATH=:memory:` for isolated tests.

## Test

```powershell
npm test
```

Development accounts are seeded only by the backend database initializer:

- `admin@eventpulse.demo` / `admin123`
- `organizer@eventpulse.demo` / `organizer123`
- `mentor@eventpulse.demo` / `mentor123`
- `participant@eventpulse.demo` / `participant123`

All protected endpoints require `Authorization: Bearer <token>` and admin resource endpoints require the Admin role.
