# Blogging App — Refactoring & Improvement Plan

> **Author:** AI Code Review  
> **Date:** March 8, 2026  
> **Current State:** Working MVP with critical gaps in security, validation, and code quality  
> **Goal:** Refactor the structure, fix all bugs, and re-create the project with best practices

---

## Table of Contents

1. [Current Codebase Overview](#1-current-codebase-overview)
2. [Current File Structure](#2-current-file-structure)
3. [Technology Stack](#3-technology-stack)
4. [Bug Report — Things That Are Broken](#4-bug-report--things-that-are-broken)
5. [Security Vulnerabilities](#5-security-vulnerabilities)
6. [Code Quality Issues](#6-code-quality-issues)
7. [Proposed New File Structure](#7-proposed-new-file-structure)
8. [Refactoring Tasks — Step by Step](#8-refactoring-tasks--step-by-step)
9. [Feature Suggestions for V2](#9-feature-suggestions-for-v2)
10. [File-by-File Review & Fixes](#10-file-by-file-review--fixes)

---

## 1. Current Codebase Overview

A server-side rendered blogging application built with **Node.js + Express + EJS + MongoDB**. Users can sign up, sign in, create blog posts, edit them, and delete them. Authentication uses JWT stored in cookies.

### What works

- User signup and signin with hashed passwords
- JWT-based cookie authentication
- Blog CRUD (create, read, update, delete)
- Basic EJS views with Bootstrap styling
- MVC-style folder organization (models, views, controllers, routes)

### What doesn't work or is incomplete

- No route protection — anyone can create/edit/delete blogs
- No ownership check — any user can modify any blog
- Hardcoded JWT secret
- Multiple typos causing schema validation failures
- Edit form doesn't pre-fill title correctly
- Navbar "Home" link goes to `#` instead of `/`
- Duplicate `method-override` setup (in `index.js` AND `routes/blog.js`)
- No error handling or error pages
- Pre-save hook rehashes password on every save (not just password changes)

---

## 2. Current File Structure

```
blogging-app/
├── index.js                    # Entry point (Express setup + root route mixed together)
├── package.json                # Name is "test", includes built-in "path" as dependency
├── .gitignore
├── README.md
├── models/
│   ├── user.js                 # User schema (has typos, no isModified check)
│   └── blog.js                 # Blog schema (has typo in "requied")
├── controllers/
│   ├── user.js                 # Signin/signup handlers (no validation, no error handling)
│   └── blog.js                 # Blog CRUD handlers (no auth check, no ownership check)
├── routes/
│   ├── user.js                 # User routes (logout is inline, not in controller)
│   └── blog.js                 # Blog routes (duplicate method-override setup)
├── services/
│   └── authentication.js       # JWT functions (HARDCODED secret!)
├── middlewares/
│   └── authentication.js       # Cookie-based auth middleware (swallows errors silently)
└── views/
    ├── home.ejs                # Blog listing ("Deleat" typo, no pagination)
    ├── signin.ejs              # Login form
    ├── signup.ejs              # Register form
    ├── addBlog.ejs             # Create blog (<h4> used instead of <label>)
    ├── editBlog.ejs            # Edit blog (title uses placeholder instead of value)
    └── partials/
        ├── head.ejs            # Bootstrap CSS CDN
        ├── navbar.ejs          # Navigation (Home link → #, not /)
        └── script.ejs          # Bootstrap JS CDN
```

---

## 3. Technology Stack

| Category        | Current                  | Status  |
|-----------------|--------------------------|---------|
| Runtime         | Node.js                  | OK      |
| Framework       | Express 5.1.0            | OK      |
| Database        | MongoDB via Mongoose 8.x | OK      |
| Template Engine | EJS                      | OK      |
| Auth            | JWT (jsonwebtoken)       | OK      |
| Styling         | Bootstrap 5.3.6 (CDN)   | OK      |
| Body Parsing    | body-parser              | **Redundant** — Express 5 has built-in `express.json()` and `express.urlencoded()` |
| Path            | path (npm)               | **Unnecessary** — `path` is a Node.js built-in module |

---

## 4. Bug Report — Things That Are Broken

### BUG-1: Typo in User schema — `requied` instead of `required`

**File:** `models/user.js` line 12  
**Impact:** The `email` field has no actual validation enforced by Mongoose. Users could create accounts with empty emails.  
```js
// BROKEN
email: { type: String, requied: true, unique: true }

// FIXED
email: { type: String, required: true, unique: true }
```

### BUG-2: Typo in Blog schema — `requied` instead of `required`

**File:** `models/blog.js` line 10  
**Impact:** Blog body is not actually required. Empty blogs can be created.  
```js
// BROKEN
body: { type: String, requied: true }

// FIXED
body: { type: String, required: true }
```

### BUG-3: Pre-save hook rehashes password on every `.save()`

**File:** `models/user.js` lines 49-63  
**Impact:** If a user document is loaded and saved (e.g., updating profile), the already-hashed password gets hashed again, corrupting it. The `isModified` check is commented out (and also has a typo: `isModefied`).  
```js
// BROKEN — commented out with typo
// if(!user.isModefied("password")){return };

// FIXED
if (!user.isModified("password")) return next();
```

### BUG-4: Edit form uses `placeholder` instead of `value` for title

**File:** `views/editBlog.ejs` line 17  
**Impact:** When editing a blog, the title field appears empty. The old title is shown as grey placeholder text, and if submitted without retyping, the title is saved as empty string.  
```html
<!-- BROKEN -->
<input type="text" placeholder="<%= blog.title%>" name="newtitle" ...>

<!-- FIXED -->
<input type="text" value="<%= blog.title%>" name="newtitle" ...>
```

### BUG-5: Navbar "Home" link points to `#`

**File:** `views/partials/navbar.ejs` line 9  
**Impact:** Clicking "Home" does nothing.  
```html
<!-- BROKEN -->
<a class="nav-link" href="#">Home</a>

<!-- FIXED -->
<a class="nav-link" href="/">Home</a>
```

### BUG-6: "Deleat" typo in home page

**File:** `views/home.ejs` line 21  
```html
<!-- BROKEN -->
<button ...>Deleat</button>

<!-- FIXED -->
<button ...>Delete</button>
```

### BUG-7: `<h4>` used instead of `<label>` in add/edit forms

**File:** `views/addBlog.ejs` line 16  
```html
<!-- BROKEN — h4 doesn't support "for" attribute, mismatched closing tag -->
<h4 for="title" class="form-label"> title </label>

<!-- FIXED -->
<label for="title" class="form-label">Title</label>
```

### BUG-8: Duplicate `method-override` in `routes/blog.js`

**File:** `routes/blog.js` lines 6-10  
**Impact:** Creates an entirely separate Express app instance inside a route file. This second instance does nothing since the router is what actually handles requests.  
```js
// BROKEN — these lines should be deleted entirely
var express = require('express')
var methodOverride = require('method-override')
var app = express()
app.use(methodOverride('_method'))
```

### BUG-9: Unauthenticated users crash the server on blog creation

**File:** `controllers/blog.js` line 9  
**Impact:** `req.user._id` throws `TypeError: Cannot read properties of undefined` when no user is logged in, because there's no auth middleware on blog routes.

---

## 5. Security Vulnerabilities

### SEC-1: CRITICAL — Hardcoded JWT Secret

**File:** `services/authentication.js` line 3  
```js
// VULNERABLE
const secret = "raghavender@123098";

// FIXED — use environment variable
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET environment variable is required");
```

### SEC-2: CRITICAL — No Route Protection on Blog Endpoints

All blog routes (`/blog/add-new`, `POST /blog`, `PATCH /blog/edit/:id`, `DELETE /blog/:id`) are accessible to unauthenticated users. Needs an `ensureAuthenticated` middleware.

### SEC-3: HIGH — No Ownership Verification

Any authenticated user can edit or delete any other user's blog posts. The controllers don't check if `blog.createdBy` matches `req.user._id`.

### SEC-4: HIGH — No Input Sanitization (XSS)

Blog title and body are rendered with `<%= %>` (escaped) which is good, but there's no server-side sanitization. If raw HTML rendering is ever added, the app becomes vulnerable to XSS.

### SEC-5: MEDIUM — No CSRF Protection

Forms submit POST/PATCH/DELETE without any CSRF token. An attacker could craft a page that submits forms to this app on behalf of a logged-in user.

### SEC-6: MEDIUM — No Security Headers

No `helmet` middleware for setting security headers (X-Content-Type-Options, X-Frame-Options, Content-Security-Policy, etc.).

### SEC-7: MEDIUM — No Rate Limiting

No protection against brute-force login attempts or spam blog creation.

### SEC-8: LOW — JWT Has No Expiration

```js
// Current — token never expires
const token = jwt.sign(payload, secret);

// Fixed — token expires in 7 days
const token = jwt.sign(payload, secret, { expiresIn: '7d' });
```

### SEC-9: LOW — Silent Error Swallowing in Auth Middleware

**File:** `middlewares/authentication.js` line 13  
```js
// BROKEN — completely swallows JWT errors
catch (error) {}

// FIXED — at minimum, clear the invalid cookie
catch (error) {
    res.clearCookie(cookieName);
}
```

---

## 6. Code Quality Issues

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| 1 | `package.json` name is `"test"` | `package.json` | Low |
| 2 | `path` listed as npm dependency (it's built-in) | `package.json` | Low |
| 3 | `body-parser` is redundant with Express 5 | `package.json` / `index.js` | Low |
| 4 | Schema variable named `Uschema` in both models | `models/*.js` | Medium |
| 5 | Inconsistent naming (`createtokenforuser` vs camelCase) | `services/authentication.js` | Medium |
| 6 | No async error handling (no try-catch in controllers) | `controllers/blog.js` | High |
| 7 | Root route handler (`GET /`) defined in `index.js` instead of a route file | `index.js` | Medium |
| 8 | No `.env.example` file documenting required env vars | Project root | Medium |
| 9 | No centralized error-handling middleware | `index.js` | High |
| 10 | Logout handler is inline in routes instead of controller | `routes/user.js` | Low |
| 11 | `var` used instead of `const`/`let` | Multiple files | Low |
| 12 | Inconsistent semicolon usage | Multiple files | Low |
| 13 | Inconsistent spacing and formatting | Multiple files | Low |
| 14 | No `PORT` env variable support | `index.js` | Low |
| 15 | Signup has no duplicate-email check (relies on Mongoose error) | `controllers/user.js` | Medium |

---

## 7. Proposed New File Structure

```
blogging-app/
├── .env.example                      # Document required env vars
├── .gitignore
├── package.json                      # Renamed, cleaned dependencies
├── README.md                         # Updated documentation
│
├── src/
│   ├── app.js                        # Express app setup (no listen)
│   ├── server.js                     # Entry point (connect DB + start server)
│   │
│   ├── config/
│   │   ├── db.js                     # MongoDB connection logic
│   │   └── env.js                    # Env variable validation
│   │
│   ├── models/
│   │   ├── User.js                   # PascalCase filename, clean schema
│   │   └── Blog.js                   # PascalCase filename, clean schema
│   │
│   ├── controllers/
│   │   ├── authController.js         # Signin, signup, logout
│   │   ├── blogController.js         # Blog CRUD
│   │   └── homeController.js         # Home page
│   │
│   ├── routes/
│   │   ├── index.js                  # Route aggregator
│   │   ├── authRoutes.js             # Auth routes
│   │   └── blogRoutes.js             # Blog routes
│   │
│   ├── middlewares/
│   │   ├── authenticate.js           # JWT cookie verification
│   │   ├── ensureAuth.js             # Redirect if not logged in
│   │   ├── ensureOwnership.js        # Check blog belongs to user
│   │   └── errorHandler.js           # Centralized error handler
│   │
│   ├── services/
│   │   └── tokenService.js           # JWT create/validate
│   │
│   ├── utils/
│   │   ├── AppError.js               # Custom error class
│   │   └── catchAsync.js             # Async error wrapper
│   │
│   └── views/
│       ├── layouts/
│       │   └── main.ejs              # Base layout (head + navbar + scripts)
│       ├── pages/
│       │   ├── home.ejs
│       │   ├── signin.ejs
│       │   ├── signup.ejs
│       │   ├── blogNew.ejs
│       │   ├── blogEdit.ejs
│       │   └── blogShow.ejs          # NEW: individual blog view page
│       ├── partials/
│       │   ├── navbar.ejs
│       │   ├── blogCard.ejs          # NEW: reusable blog card component
│       │   ├── flash.ejs             # NEW: flash message partial
│       │   └── footer.ejs            # NEW: footer partial
│       └── errors/
│           ├── 404.ejs               # NEW: not found page
│           └── 500.ejs               # NEW: server error page
│
├── public/                           # NEW: static assets
│   ├── css/
│   │   └── style.css                 # Custom styles
│   ├── js/
│   │   └── main.js                   # Client-side JS
│   └── images/
│
└── tests/                            # NEW: test suite
    ├── models/
    ├── controllers/
    └── routes/
```

### Key structural changes

| What changed | Why |
|-------------|-----|
| Source code moved into `src/` | Separates app code from config files |
| `app.js` and `server.js` split | App setup is testable without starting the server |
| `config/` folder added | Centralizes DB connection and env validation |
| Model files use PascalCase | Convention: model files match the model name (`User.js` exports `User`) |
| Controllers renamed descriptively | `user.js` → `authController.js`, clearer purpose |
| Route files renamed | `user.js` → `authRoutes.js` |
| `utils/` folder added | Houses reusable helpers like `AppError` and `catchAsync` |
| `public/` folder added | Serves static assets (custom CSS, client JS, images) |
| Error pages added | 404 and 500 pages instead of raw errors |
| Blog show page added | Individual blog view with full content |
| Layout system | Avoids repeating `<!DOCTYPE>`, `<head>`, etc. in every page |
| `tests/` folder added | Space for unit and integration tests |

---

## 8. Refactoring Tasks — Step by Step

### Phase 1: Fix Critical Bugs (Do First)

- [ ] **1.1** Fix `requied` → `required` typo in `models/user.js` (email field)
- [ ] **1.2** Fix `requied` → `required` typo in `models/blog.js` (body field)
- [ ] **1.3** Uncomment and fix `isModified` check in User pre-save hook
- [ ] **1.4** Fix edit form: change `placeholder` to `value` for title input
- [ ] **1.5** Fix "Deleat" → "Delete" in `home.ejs`
- [ ] **1.6** Fix `<h4>` → `<label>` in `addBlog.ejs` and `editBlog.ejs`
- [ ] **1.7** Fix navbar Home link: `#` → `/`
- [ ] **1.8** Remove duplicate `method-override` setup from `routes/blog.js`

### Phase 2: Fix Security Issues

- [ ] **2.1** Move JWT secret to `.env` and read from `process.env.JWT_SECRET`
- [ ] **2.2** Create `.env.example` with all required variables
- [ ] **2.3** Add JWT expiration (`expiresIn: '7d'`)
- [ ] **2.4** Create `ensureAuth` middleware that redirects unauthenticated users
- [ ] **2.5** Apply `ensureAuth` to all blog routes
- [ ] **2.6** Create `ensureOwnership` middleware to verify blog belongs to user
- [ ] **2.7** Apply `ensureOwnership` to edit and delete routes
- [ ] **2.8** Add `helmet` for security headers
- [ ] **2.9** Add `express-rate-limit` for rate limiting
- [ ] **2.10** Fix silent error swallowing in auth middleware

### Phase 3: Clean Up Code Quality

- [ ] **3.1** Rename package from `"test"` to `"blogging-app"`
- [ ] **3.2** Remove `path` from npm dependencies (it's built-in)
- [ ] **3.3** Remove `body-parser` and use `express.json()` / `express.urlencoded()`
- [ ] **3.4** Rename schema variables from `Uschema` to `userSchema` / `blogSchema`
- [ ] **3.5** Rename `createtokenforuser` → `createTokenForUser`, `validatetoken` → `validateToken`
- [ ] **3.6** Add try-catch (or `catchAsync` wrapper) to all controller functions
- [ ] **3.7** Move root `GET /` handler from `index.js` into a controller + route
- [ ] **3.8** Move logout handler from route file into `authController.js`
- [ ] **3.9** Replace all `var` with `const`/`let`
- [ ] **3.10** Add consistent formatting (consider adding Prettier + ESLint)
- [ ] **3.11** Add `PORT` env variable with fallback: `process.env.PORT || 3000`

### Phase 4: Restructure Project

- [ ] **4.1** Create `src/` directory and move source files
- [ ] **4.2** Split `index.js` into `app.js` (setup) and `server.js` (listen)
- [ ] **4.3** Create `config/db.js` for MongoDB connection
- [ ] **4.4** Create `config/env.js` for environment variable validation
- [ ] **4.5** Rename model files to PascalCase (`User.js`, `Blog.js`)
- [ ] **4.6** Rename controller/route files to be descriptive
- [ ] **4.7** Create route aggregator (`routes/index.js`)
- [ ] **4.8** Create `utils/AppError.js` custom error class
- [ ] **4.9** Create `utils/catchAsync.js` async error wrapper
- [ ] **4.10** Create `middlewares/errorHandler.js` centralized error handler
- [ ] **4.11** Create `public/` folder and serve static assets
- [ ] **4.12** Reorganize views into `layouts/`, `pages/`, `partials/`, `errors/`

### Phase 5: Improve UI/UX

- [ ] **5.1** Create a base layout template to reduce EJS repetition
- [ ] **5.2** Add a reusable `blogCard.ejs` partial
- [ ] **5.3** Add a footer partial
- [ ] **5.4** Add custom CSS file for better styling
- [ ] **5.5** Add flash messages for success/error feedback
- [ ] **5.6** Add 404 and 500 error pages
- [ ] **5.7** Add pagination to the blog listing
- [ ] **5.8** Add individual blog view page (`/blog/:id`)
- [ ] **5.9** Show blog author name (populate `createdBy`)
- [ ] **5.10** Only show edit/delete buttons for the blog owner
- [ ] **5.11** Add confirm dialog before delete
- [ ] **5.12** Make the UI responsive and visually polished

### Phase 6: Add Features (V2)

- [ ] **6.1** Add input validation (express-validator or joi)
- [ ] **6.2** Add duplicate email check on signup with user-friendly error
- [ ] **6.3** Add password confirmation field on signup
- [ ] **6.4** Add password strength requirements
- [ ] **6.5** Add user profile page
- [ ] **6.6** Add blog categories/tags
- [ ] **6.7** Add search functionality
- [ ] **6.8** Add markdown support for blog body
- [ ] **6.9** Add image/cover photo upload (multer)
- [ ] **6.10** Add blog comments
- [ ] **6.11** Add "like" feature
- [ ] **6.12** Use ADMIN role for admin dashboard
- [ ] **6.13** Add request logging (morgan)
- [ ] **6.14** Add unit and integration tests
- [ ] **6.15** Add SEO-friendly slugs for blog URLs

---

## 9. Feature Suggestions for V2

### Must-Have

| Feature | Description | Packages needed |
|---------|-------------|-----------------|
| **Input Validation** | Validate email format, password strength, blog fields | `express-validator` or `joi` |
| **Flash Messages** | Show success/error messages after actions | `connect-flash` + `express-session` |
| **Pagination** | Paginate blog list (10-20 per page) | Built-in with Mongoose `.skip()` and `.limit()` |
| **Blog Detail Page** | View a single blog post at `/blog/:slug` | None |
| **User Profile** | View user's blogs at `/user/:id` | None |
| **Request Logging** | Log HTTP requests for debugging | `morgan` |

### Nice-to-Have

| Feature | Description | Packages needed |
|---------|-------------|-----------------|
| **Markdown Support** | Write blog posts in Markdown | `marked` + `dompurify` |
| **Image Upload** | Upload cover images for blogs | `multer` + `cloudinary` |
| **Blog Comments** | Nested comment system | New `Comment` model |
| **Search** | Search blogs by title/content | MongoDB text index |
| **Categories/Tags** | Organize blogs by topic | Extend Blog schema |
| **Like/Bookmark** | Save favorite blogs | New `Like` model or array on Blog |
| **Admin Dashboard** | Manage all users and blogs | Use existing `role` field |
| **Password Reset** | Email-based password recovery | `nodemailer` |
| **Email Verification** | Verify email on signup | `nodemailer` |
| **RSS Feed** | Auto-generate RSS for the blog | `rss` package |

### Developer Experience

| Improvement | Description | Packages needed |
|-------------|-------------|-----------------|
| **ESLint + Prettier** | Consistent code formatting | `eslint`, `prettier` |
| **Testing** | Unit and integration tests | `jest`, `supertest` |
| **CI/CD** | Automated testing on push | GitHub Actions |
| **Docker** | Containerize the app | `Dockerfile`, `docker-compose.yml` |
| **Environment Validation** | Fail fast if env vars missing | `envalid` or custom |

---

## 10. File-by-File Review & Fixes

### `package.json`

```diff
- "name": "test",
+ "name": "blogging-app",

  "dependencies": {
-   "body-parser": "^2.2.0",    // Remove — Express 5 has built-in body parsing
-   "path": "^0.12.7",          // Remove — built-in Node.js module
+   "helmet": "^8.x",           // Add — security headers
+   "express-rate-limit": "^7.x", // Add — rate limiting
+   "morgan": "^1.x",           // Add — request logging
  }
```

### `models/user.js`

```diff
  email:{
      type: String,
-     requied: true,
+     required: true,
      unique: true,
  },

- // if(!user.isModefied("password")){return };
+ if (!user.isModified("password")) return next();
```

### `models/blog.js`

```diff
- const Uschema = Schema({
+ const blogSchema = new Schema({
      ...
      body:{
          type: String,
-         requied: true,
+         required: true,
      },
```

### `services/authentication.js`

```diff
- const secret = "raghavender@123098";
+ const secret = process.env.JWT_SECRET;
+ if (!secret) throw new Error("JWT_SECRET is required");

- const token = jwt.sign(payload, secret);
+ const token = jwt.sign(payload, secret, { expiresIn: '7d' });

- function createtokenforuser(user){
+ function createTokenForUser(user){

- function validatetoken(token){
+ function validateToken(token){
```

### `middlewares/authentication.js`

```diff
  try {
      const userPayload = validatetoken(tokenCookieValue);
      req.user = userPayload;
- } catch (error) {}
+ } catch (error) {
+     res.clearCookie(cookieName);
+ }
```

### `routes/blog.js` — Remove duplicate setup

```diff
  const { Router } = require("express");
  const router = Router();
  const Blog = require('../models/blog');
  const { newBlog, editBlog, deleteBlog, getAddBlog, getUpdateBlog } = require("../controllers/blog");
+ const { ensureAuth } = require("../middlewares/ensureAuth");

- var express = require('express')
- var methodOverride = require('method-override')
- var app = express()
- app.use(methodOverride('_method'))

- router.get('/add-new', getAddBlog);
+ router.get('/add-new', ensureAuth, getAddBlog);

- router.post('/', newBlog);
+ router.post('/', ensureAuth, newBlog);

- router.get('/edit/:id', getUpdateBlog);
+ router.get('/edit/:id', ensureAuth, getUpdateBlog);

- router.patch('/edit/:id', editBlog);
+ router.patch('/edit/:id', ensureAuth, editBlog);

- router.delete('/:id', deleteBlog);
+ router.delete('/:id', ensureAuth, deleteBlog);
```

### `controllers/blog.js` — Add error handling + ownership check

```diff
  async function editBlog(req, res){
-     let { newtitle, newbody } = req.body;
-     let blog = await Blog.findByIdAndUpdate(req.params.id, {
-         title: newtitle,
-         body: newbody,
-     });
-     return res.redirect('/');
+     const blog = await Blog.findById(req.params.id);
+     if (!blog) return res.status(404).render('errors/404');
+     if (blog.createdBy.toString() !== req.user._id) {
+         return res.status(403).redirect('/');
+     }
+     blog.title = req.body.newtitle;
+     blog.body = req.body.newbody;
+     await blog.save();
+     return res.redirect('/');
  }
```

### `views/editBlog.ejs` — Fix title pre-fill

```diff
- <input type="text" placeholder="<%= blog.title%>" name="newtitle" ...>
+ <input type="text" value="<%= blog.title%>" name="newtitle" ...>
```

### `views/partials/navbar.ejs` — Fix home link

```diff
- <a class="nav-link" href="#">Home</a>
+ <a class="nav-link" href="/">Home</a>
```

### `views/home.ejs` — Fix typo

```diff
- <button ...>Deleat</button>
+ <button ...>Delete</button>
```

---

## Priority Order for Refactoring

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| **P0** | Phase 1 — Fix bugs | 1 hour | Prevents crashes and data corruption |
| **P0** | Phase 2 — Security | 2-3 hours | Prevents unauthorized access |
| **P1** | Phase 3 — Code quality | 2 hours | Improves maintainability |
| **P1** | Phase 4 — Restructure | 3-4 hours | Sets foundation for scalability |
| **P2** | Phase 5 — UI/UX | 4-6 hours | Improves user experience |
| **P3** | Phase 6 — New features | Ongoing | Adds value |

---

> **Recommendation:** Start with Phase 1 and Phase 2 immediately — these fix bugs and security holes. Then proceed with Phase 3-4 to restructure before adding any new features. This ensures the foundation is solid before building on top of it.
