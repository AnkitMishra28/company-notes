# Deployment Guide

This guide will walk you through deploying the Multi-Tenant SaaS Notes Application to Vercel.

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Vercel Account**: Create a free account at [vercel.com](https://vercel.com)
3. **GitHub Account**: For hosting your code repository

## Step 1: Set up Supabase

### 1.1 Create a New Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `notes-saas-app`
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest to your users
5. Click "Create new project"

### 1.2 Set up Database
1. In your Supabase project, go to the **SQL Editor**
2. Copy the contents of `setup-database.sql` from this repository
3. Paste and run the SQL script
4. This will create all necessary tables, policies, and triggers

### 1.3 Create Test Users
1. Go to **Authentication** > **Users** in your Supabase dashboard
2. Click "Add user" and create the following users:
   - Email: `admin@acme.test`, Password: `password`
   - Email: `user@acme.test`, Password: `password`
   - Email: `admin@globex.test`, Password: `password`
   - Email: `user@globex.test`, Password: `password`

### 1.4 Get API Keys
1. Go to **Settings** > **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key
   - **service_role** key (keep this secret!)

## Step 2: Prepare Your Code

### 2.1 Fork/Clone Repository
```bash
git clone <your-repo-url>
cd company-notes-main
```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Test Locally (Optional)
Create a `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Run locally:
```bash
npm run dev
```

## Step 3: Deploy to Vercel

### 3.1 Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Choose the project directory: `company-notes-main`

### 3.2 Configure Environment Variables
In the Vercel project settings, add these environment variables:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |

### 3.3 Deploy
1. Click "Deploy" in Vercel
2. Wait for the deployment to complete
3. Your app will be available at `https://your-project.vercel.app`

## Step 4: Test Your Deployment

### 4.1 Test Health Endpoint
```bash
curl https://your-project.vercel.app/api/health
```
Expected response: `{"status":"ok"}`

### 4.2 Test Authentication
1. Visit your deployed URL
2. Try logging in with the test accounts:
   - `admin@acme.test` / `password`
   - `user@acme.test` / `password`
   - `admin@globex.test` / `password`
   - `user@globex.test` / `password`

### 4.3 Test Features
1. **Notes Management**: Create, edit, delete notes
2. **Tenant Isolation**: Verify users can only see their tenant's data
3. **Role-Based Access**: Test admin vs member permissions
4. **Subscription Limits**: Try creating more than 3 notes on free plan
5. **Upgrade Feature**: Test the upgrade functionality (admin only)

## Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain
1. In Vercel dashboard, go to **Settings** > **Domains**
2. Add your custom domain
3. Update DNS records as instructed by Vercel

## Troubleshooting

### Common Issues

**1. Database Connection Errors**
- Verify your Supabase URL and keys are correct
- Check that the database schema was created properly
- Ensure RLS policies are active

**2. Authentication Issues**
- Verify test users were created in Supabase Auth
- Check that the profile creation trigger is working
- Look at Supabase logs for errors

**3. API Endpoint Errors**
- Check Vercel function logs
- Verify environment variables are set correctly
- Test endpoints individually with curl/Postman

**4. CORS Issues**
- The API endpoints include CORS headers
- If you encounter CORS issues, check the API function code

### Debugging Tips

1. **Check Vercel Function Logs**:
   - Go to Vercel dashboard > Functions tab
   - Click on failed functions to see error logs

2. **Check Supabase Logs**:
   - Go to Supabase dashboard > Logs
   - Monitor authentication and database logs

3. **Test API Endpoints**:
   ```bash
   # Test with authentication
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        https://your-project.vercel.app/api/notes
   ```

## Security Considerations

1. **Environment Variables**: Never commit sensitive keys to git
2. **RLS Policies**: Ensure all tables have proper RLS enabled
3. **API Security**: All endpoints require authentication
4. **CORS**: Configured for external access as required

## Monitoring

1. **Vercel Analytics**: Monitor your app's performance
2. **Supabase Monitoring**: Track database usage and performance
3. **Error Tracking**: Consider adding error tracking service

## Next Steps

After successful deployment:

1. **Set up monitoring** and alerting
2. **Configure backup** strategies for your database
3. **Implement proper logging** for production debugging
4. **Consider adding** additional security measures
5. **Plan for scaling** as your user base grows

## Support

If you encounter issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review [Vercel Documentation](https://vercel.com/docs)
3. Check the application logs in both platforms
4. Verify all environment variables are correctly set
