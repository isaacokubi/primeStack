# PrimeStack audit and fixes

## High priority fixes applied

### Image handling
- Frontend API normalizes image fields consistently for site settings, products, case studies, blog posts, jobs and SEO images.
- Legacy raw base64 image strings are converted into browser-safe data URLs.
- Protocol/HTTPS image values are preserved.
- Authenticated Cloudinary image upload endpoint: `POST /api/uploads/image`.
- Founder photo upload uses Cloudinary and stores the returned HTTPS URL instead of a large base64 value in MongoDB.
- Uploads are limited to 5 MB and support JPG, PNG, WebP and GIF.
- Cloudinary automatic quality/format optimization is enabled.

### Vercel frontend
- Vite SPA rewrite is configured so direct refreshes on React routes work.
- Production API URL is controlled by `VITE_API_URL`.
- Frontend and backend are separated for Vercel/Render deployment.

### Render backend
- Render deploys only the Express API.
- Render uses `npm ci` and `npm start`.
- Health endpoint is `/api/health`.

### CORS/security
- Production CORS is restricted to the exact origins in `CLIENT_URL`.
- Development permits localhost/127.0.0.1.
- Production authentication cookies use `Secure` + `SameSite=None` for Vercel-to-Render authentication.
- Production JWT secret is required.

## Architecture

Browser -> Vercel React/Vite frontend -> Render Express API -> MongoDB Atlas
                                              \-> Cloudinary image storage

## Verification

Reviewed frontend routing, API configuration, authentication, image handling, Render/Vercel configuration, startup flow and seed behavior. A clean dependency install/build should be performed in Vercel/Render before production release.

See `DEPLOYMENT_GUIDE.md` for deployment and environment variables.
