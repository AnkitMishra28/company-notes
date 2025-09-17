# Multi-Tenant SaaS Notes Application

A comprehensive multi-tenant SaaS Notes Application built with React, TypeScript, and Supabase, deployed on Vercel. This application demonstrates proper tenant isolation, role-based access control, and subscription-based feature gating.

## 🏗️ Architecture

### Multi-Tenancy Approach
This application uses a **shared schema with tenant_id approach** for data isolation:
- All tables include a `tenant_id` column that references the `tenants` table
- Row Level Security (RLS) policies ensure strict tenant isolation
- Each tenant can only access their own data

### Database Schema
- **Tenants**: Store tenant information (slug, name, plan)
- **Profiles**: Extends auth.users with role and tenant_id
- **Notes**: Stores notes with tenant isolation and user ownership

### Technology Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth with JWT
- **Deployment**: Vercel

## 🚀 Features

### Multi-Tenancy
- Support for multiple tenants (Acme, Globex)
- Strict data isolation between tenants
- Tenant-specific user management

### Authentication & Authorization
- JWT-based authentication via Supabase
- Role-based access control (Admin/Member)
- Predefined test accounts for evaluation

### Subscription Management
- Free Plan: Limited to 3 notes
- Pro Plan: Unlimited notes
- Admin-only upgrade functionality

### Notes Management
- Full CRUD operations for notes
- Tenant-isolated note storage
- User ownership tracking

### Team Management
- Admin-only user invitation system
- Role assignment (Admin/Member)
- Team member management

## 🧪 Test Accounts

All test accounts use the password: `password`

| Email | Role | Tenant |
|-------|------|--------|
| admin@acme.test | Admin | Acme |
| user@acme.test | Member | Acme |
| admin@globex.test | Admin | Globex |
| user@globex.test | Member | Globex |

## 📋 API Endpoints

### Health Check
- `GET /api/health` - Returns `{ "status": "ok" }`

### Notes API
- `GET /api/notes` - List all notes for current tenant
- `POST /api/notes` - Create a new note
- `GET /api/notes/:id` - Retrieve specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Tenant API
- `POST /api/tenants/:slug/upgrade` - Upgrade tenant to Pro plan (Admin only)

### User API
- `POST /api/users/invite` - Invite user to tenant (Admin only)

All API endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## 🛠️ Setup & Development

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/AnkitMishra28/company-notes.git
cd company-notes-main
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. **Set up the database**
Run the SQL commands from `src/lib/database.sql` in your Supabase SQL editor to create tables, policies, and test data.

5. **Start the development server**
```bash
npm run dev
```

## 🗄️ Database Setup

1. Create a new Supabase project
2. Run the following SQL in the Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test tenants
INSERT INTO tenants (slug, name, plan) VALUES 
  ('acme', 'Acme Corporation', 'free'),
  ('globex', 'Globex Corporation', 'free');

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (see database.sql for complete policies)
-- ... (additional policies for data isolation)
```

3. Create the test users in Supabase Auth dashboard with the predefined emails

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Set Environment Variables**
   In Vercel dashboard, add these environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Deploy**
   - Vercel will automatically deploy on every push to main branch
   - The `vercel.json` configuration handles both frontend and API routes

### CORS Configuration
The API endpoints are configured with CORS headers to allow access from:
- Automated test scripts
- Dashboard applications
- Any external application

## 🔒 Security Features

### Tenant Isolation
- Row Level Security (RLS) policies ensure strict data isolation
- All queries automatically filter by tenant_id
- Users cannot access data from other tenants

### Role-Based Access Control
- **Admin**: Can invite users, upgrade plans, manage team
- **Member**: Can only create, view, edit, and delete notes
- API endpoints enforce role-based permissions

### Authentication
- JWT-based authentication via Supabase
- All API endpoints require valid authentication
- Service role key used for admin operations

## 🧪 Testing

The application is designed to work with automated test scripts that verify:
- Health endpoint availability
- Successful login for all test accounts
- Tenant isolation enforcement
- Role-based restrictions
- Free plan note limits
- Pro plan upgrade functionality
- All CRUD operations

## 📝 Notes

- The application uses Supabase for authentication and database
- All API endpoints are serverless functions deployed on Vercel
- The frontend is a single-page application with client-side routing
- Database migrations and seed data are included in the repository
- CORS is enabled for external API access as required
