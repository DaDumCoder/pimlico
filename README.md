# Pimlico AA API (Sepolia)

1. `npm install`
2. Copy `.env.example` to `.env` and set `PIMLICO_API_KEY`
3. Run with `npm run dev`

## API Endpoints

- `POST /api/auth/register` { username, password }
- `POST /api/wallet/create` { username, password } → returns `safeAddress`
- `POST /api/tx/send` { username, password, to, value, data }
