# PrimeStack deployment guide

## Architecture
- Frontend: React/Vite on Vercel
- Backend: Express/Node on Render
- Database: MongoDB Atlas
- Images: Cloudinary
- Authentication: HTTP-only cookie + JWT

## Local verification
```bash
npm install --prefix server
npm install --prefix client
```

Create `server/.env` from `server/.env.example` and `client/.env` from `client/.env.example`.

Start the API:
```bash
cd server
npm run dev
```

In another terminal:
```bash
cd client
npm run dev
```

Open `http://localhost:5173`.

## MongoDB Atlas
Create a cluster and database user. Add the Atlas connection string to Render as `MONGODB_URI=mongodb+srv://...`.

## Cloudinary
Set these Render variables:
```text
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET
CLOUDINARY_FOLDER=primestack
```

## Render backend
Create a Render Web Service from the repository:
- Root Directory: `server`
- Runtime: Node
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Environment variables:
```text
NODE_ENV=production
MONGODB_URI=YOUR_MONGODB_ATLAS_URI
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=7d
CLIENT_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
COOKIE_SECURE=true
ADMIN_NAME=PrimeStack Admin
ADMIN_EMAIL=YOUR_ADMIN_EMAIL
ADMIN_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET
CLOUDINARY_FOLDER=primestack
```

## Vercel frontend
Import the same repository into Vercel:
- Framework Preset: Vite
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

Add:
```text
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
VITE_SITE_EMAIL=hello@primestack.dev
```

## Final CORS configuration
After Vercel deployment, set Render:
```text
CLIENT_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
```

For multiple approved frontend domains, separate them with commas.

## Production test checklist
1. Vercel homepage loads.
2. Refresh `/products`, `/about`, `/blog` and other React routes without a 404.
3. Products load from Render.
4. Register/login/logout work.
5. Admin login and authorization work.
6. Site customizer loads.
7. Founder image uploads to Cloudinary and renders.
8. Product/content images render over HTTPS.
9. Contact inquiry works.
10. Customer/admin inquiry workspace works.
11. Browser DevTools shows no CORS, mixed-content, 401 or failed image requests.

Never commit `.env` files or production secrets. Only `VITE_*` variables belong in Vercel because they are exposed to the browser.
