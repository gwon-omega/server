# E-Commerce Frontend Project Structure & Integration Guide

This document provides a complete, scalable frontend architecture and implementation guide for integrating with the backend API. It is designed for React (Next.js or CRA) but can be adapted to other frameworks.

## 1. Folder Structure

```
client/
├── public/
│   └── images/             # placeholder images for products, banners, logos
├── src/
│   ├── app/
│   │   ├── page.tsx        # Home page
│   │   ├── layout.tsx      # Root layout with header/footer
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── forgot/page.tsx
│   │   ├── cart/
│   │   │   ├── page.tsx
│   │   │   └── checkout/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   └── orders/page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx   # order detail page
│   │   ├── payments/
│   │   │   └── page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx    # product detail
│   │   │   └── manage/page.tsx  # vendor product moderation
│   │   ├── reviews/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   ├── wishlist/
│   │   │   └── page.tsx
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                     # reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx            # for products
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── Spinner.tsx
│   │   │
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── CartItem.tsx
│   │   ├── ProductCard.tsx
│   │   ├── OrderCard.tsx
│   │   ├── ReviewCard.tsx
│   │   └── Notification.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   ├── useProducts.ts
│   │   └── useOrders.ts
│   │
│   ├── api/
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   ├── users.ts
│   │   └── payments.ts
│   │
│   ├── store/
│   │   ├── index.ts
│   │   ├── cartSlice.ts
│   │   ├── productSlice.ts
│   │   └── userSlice.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   └── tailwind.config.js
│   │
│   ├── utils/
│   │   ├── formatPrice.ts
│   │   ├── formatDate.ts
│   │   └── helpers.ts
│   │
│   └── providers/
│       ├── AuthProvider.tsx
│       └── QueryProvider.tsx
│
├── .env
├── next.config.js
├── tsconfig.json
└── package.json

```

## 2. Pages & Navigation

### Public/User Pages
- `/` — Home (featured products, categories)
- `/products` — Product listing (search, filter, sort)
- `/products/[id]` — Product detail (info, reviews, add to cart)
- `/cart` — Cart view, update, remove, proceed to checkout
- `/checkout` — Checkout form, address, payment
- `/orders` — User order history
- `/orders/[id]` — Order detail, download transcript
- `/wishlist` — Wishlist management
- `/auth/login` — Login
- `/auth/signup` — Signup
- `/auth/forgot` — Forgot password
- `/auth/reset` — Reset password (via token)
- `/profile` — User profile, update info

### Admin Pages
- `/dashboard` — Admin analytics (totals, revenue, top products, recent orders)
- `/dashboard/products` — Product moderation (approve, edit, delete)
- `/dashboard/orders` — All orders (view, update, delete)
- `/dashboard/users` — User/vendor management
- `/dashboard/categories` — Category management

### Mixed/Other
- `/payments/verify` — Payment verification/callback
- `/reviews` — Submit/view reviews

## 3. API Service Modules (`src/api/`)
Each resource (user, product, order, etc.) gets a service file:

- `auth.ts` — login, signup, forgot/reset password
- `products.ts` — list, detail, create, update, delete, moderate
- `orders.ts` — place order, get user orders, get all orders (admin), order detail
- `cart.ts` — get/update cart
- `wishlist.ts` — get/update wishlist
- `dashboard.ts` — admin analytics
- `payments.ts` — initiate, verify, webhook
- `categories.ts` — list, create, update, delete
- `users.ts` — admin user management
- `reviews.ts` — submit/view reviews

Each service exports async functions using fetch/axios:
```ts
// Example: src/api/products.ts
export async function getProducts(params) {
  return axios.get('/api/products', { params });
}
export async function getProduct(id) {
  return axios.get(`/api/products/${id}`);
}
// ...
```

## 4. API Connections & Data Flow
- Use JWT tokens (from login/signup) for authenticated requests (attach in Authorization header).
- Use role-based UI logic: show/hide admin features based on user role (from JWT/user profile).
- For forms (login, signup, checkout, product add/edit), use controlled components and handle API errors.
- Use optimistic UI updates for cart/wishlist.
- Use SWR/React Query for data fetching and caching if possible.

## 5. Navigation & Routing
- Use a router (React Router, Next.js router) to map URLs to pages.
- Protect routes: redirect unauthenticated users from protected pages; restrict admin pages to admin users.
- Provide a navigation bar with links:
  - Home, Products, Cart, Orders, Wishlist, Profile
  - Admin: Dashboard, Products, Orders, Users, Categories

## 6. State Management
- Use Context API, Redux, or Zustand for global state (auth, cart, user info).
- Store JWT in httpOnly cookie or secure storage.
- Keep cart/wishlist in state and sync with backend.

## 7. Components
- `ProductCard`, `ProductList`, `ProductDetail`
- `CartItem`, `CartSummary`
- `OrderList`, `OrderDetail`
- `ReviewList`, `ReviewForm`
- `LoginForm`, `SignupForm`, `ForgotPasswordForm`, `ResetPasswordForm`
- `DashboardStats`, `TopProductsTable`, `RecentOrdersTable`
- `UserTable`, `CategoryTable`, `PaymentStatus`
- `Navbar`, `Sidebar`, `Footer`, `ProtectedRoute`

## 8. Hooks
- `useAuth` — login/logout, user info, role
- `useCart` — cart state, add/remove/update
- `useOrders` — fetch user/admin orders
- `useProducts` — fetch/list products
- `useDashboard` — fetch admin analytics

## 9. Utils
- `api.ts` — axios/fetch instance with interceptors
- `formatDate`, `formatCurrency`, `parseJwt`, etc.

## 10. Implementation Notes
- **API Integration:**
  - All endpoints are under `/api/` (e.g., `/api/products`, `/api/orders`).
  - Use correct HTTP methods: GET (fetch), POST (create), PUT/PATCH (update), DELETE (remove).
  - Pass JWT in Authorization header: `Bearer <token>`.
  - Handle 401/403 errors by redirecting to login or showing error.
- **Role-based Access:**
  - Check user role before showing admin/vendor features.
  - Hide admin navigation for non-admin users.
- **Error Handling:**
  - Show user-friendly error messages for failed API calls.
  - Validate forms on client and server.
- **Security:**
  - Never expose secrets in frontend code.
  - Use HTTPS in production.
- **Scalability:**
  - Keep components small and reusable.
  - Use code splitting/lazy loading for large pages.

---

## Quick Start for Frontend Developers
1. Copy `.env.example` to `.env` and fill in API base URL and any required keys.
2. Install dependencies:
   ```sh
   npm install
   # or
   pnpm install
   ```
3. Start the dev server:
   ```sh
   npm run dev
   # or
   pnpm dev
   ```
4. Implement pages/components as described above, using the API service modules for backend integration.
5. Coordinate with backend for any new endpoints or changes.

---

For any questions, refer to backend API docs or contact the backend team.
