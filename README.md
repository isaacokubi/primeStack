# primeStack

A production-oriented MERN software product company website and lightweight content management system, implemented entirely in JavaScript.

## Stack

- React 19 + Vite
- React Router
- Tailwind-compatible frontend setup + custom responsive design system
- Framer Motion
- Axios
- Node.js + Express 5
- MongoDB + Mongoose
- JWT authentication in HTTP-only cookies
- bcrypt password hashing
- Helmet, CORS and rate limiting

## Features

- Premium responsive company website
- Data-driven product catalogue and dynamic product pages
- Product search, filtering and featured products
- Services, About and Technology pages
- Dynamic Blog, Case Studies and Careers content
- Contact lead capture and inquiry management
- Testimonials and newsletter API
- Admin authentication with Admin/Editor roles
- Product CRUD from `/admin`
- Dashboard statistics and contact status management
- Automatic starter product and admin seeding when MongoDB is connected
- Production-ready environment configuration
- Reduced-motion support and accessible form controls

## Local development

```bash
npm run install:all
cp server/.env.example server/.env
npm run dev
```

Frontend: http://localhost:5173
API: http://localhost:5000
Admin: http://localhost:5173/admin/login

Default development admin values are controlled by `server/.env`:

```text
ADMIN_EMAIL=admin@primestack.dev
ADMIN_PASSWORD=ChangeMe123!
```

Change these values before production.

## MongoDB

Set `MONGODB_URI` to a MongoDB Atlas connection string for production. The API can start without MongoDB for health checks, but persistent CMS data and automatic seed data require a database connection.

## Production

Set a strong `JWT_SECRET`, production `CLIENT_URL`, secure cookies, MongoDB Atlas credentials, and real mail/cloud-media credentials. Never commit `.env` files or secrets.

The public product pages are intentionally data-driven: creating a product through the CMS makes it available at `/products/<slug>` without adding a new React page.
