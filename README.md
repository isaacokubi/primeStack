# primeStack

A production-oriented MERN software product company platform with a premium public website, CMS/admin workspace and secure customer portal.

## Stack

- React 19 + Vite
- React Router
- Framer Motion + Lucide
- Axios
- Node.js + Express 5
- MongoDB + Mongoose
- JWT authentication in HTTP-only cookies
- bcrypt password hashing
- Helmet, CORS and rate limiting

## Public platform

- Premium responsive company website
- Product catalogue, search and dynamic product pages
- Services, About and Technology pages
- Dynamic Blog, Case Studies and Careers content
- Contact lead capture
- Testimonials and newsletter subscription
- Privacy, Terms and Security pages
- Responsive mobile navigation and reduced-motion support

## Customer portal

- Customer registration at `/register`
- Customer login at `/login`
- Secure HTTP-only session cookie
- Customer dashboard at `/dashboard`
- Product catalogue access
- Customer enquiry history
- Account/profile settings at `/dashboard/settings`
- Password change
- Role-based API authorization

Customer accounts are always created with the `Customer` role. They cannot access admin APIs.

## Admin platform

- Admin login at `/admin/login`
- Existing CMS dashboard at `/admin`
- Admin/Editor role authorization
- Product CRUD
- Blog, Case Study and Careers content management
- Testimonials
- Contact enquiry management
- Dashboard statistics
- Customer count and customer-management API endpoints

## Local development

```bash
npm run install:all
cp server/.env.example server/.env
npm run dev
```

Frontend: http://localhost:5173  
API: http://localhost:5000  
Customer registration: http://localhost:5173/register  
Customer login: http://localhost:5173/login  
Admin login: http://localhost:5173/admin/login

## Environment

Configure `server/.env` with MongoDB, JWT and admin credentials. For production, `NODE_ENV=production`, a strong `JWT_SECRET`, `ADMIN_PASSWORD`, HTTPS frontend `CLIENT_URL`, and secure cookies are required. Never commit real secrets.

The frontend API URL is configured with `VITE_API_URL` in `client/.env`.

## MongoDB

Set `MONGODB_URI` to a MongoDB Atlas connection string for production. Persistent CMS data, customer accounts and automatic seed data require a database connection.

## Production notes

- Do not use the development JWT secret in production.
- Use a unique strong admin password.
- Serve frontend and API over HTTPS.
- Set `COOKIE_SECURE=true` or run with `NODE_ENV=production`.
- Set `CLIENT_URL` to the exact production frontend origin(s).
- Review CORS origins before deployment.
- Never commit `.env` files, database credentials, JWT secrets or API keys.
