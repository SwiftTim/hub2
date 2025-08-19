# Deployment Guide - Academic Hub Platform

## Overview
This guide will help you deploy the Academic Hub platform with different configuration options based on your available services.

## Deployment Options

### Option 1: Simplified Deployment (Recommended for Quick Start)
Uses only Supabase for all features - easiest to deploy.

### Option 2: Full-Stack Deployment
Uses the complete architecture with Express.js backend, MongoDB, and all advanced features.

---

## Option 1: Simplified Deployment (Supabase Only)

### Prerequisites
- ✅ Supabase account (already configured)
- ✅ Vercel account (for deployment)

### Environment Variables (Already Set)
\`\`\`env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

### Quick Deploy Steps
1. **Deploy to Vercel:**
   \`\`\`bash
   npm install
   npm run build
   vercel --prod
   \`\`\`

2. **Run Database Migrations:**
   - All required tables are already created in your Supabase database
   - The app should work immediately

### Features Available in Simplified Mode
- ✅ User authentication (email/password)
- ✅ Unit management and enrollment
- ✅ Real-time chat groups (using Supabase real-time)
- ✅ Assignment submission and grading
- ✅ Secure assessments with anti-cheat
- ✅ Learning resources management
- ✅ Research project tracking
- ✅ Analytics and reporting
- ✅ Mobile-responsive design

---

## Option 2: Full-Stack Deployment (Advanced)

### Additional Services Needed

#### 1. MongoDB Atlas (for Chat Messages)
**Cost:** Free tier available
**Setup:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Add to environment variables

#### 2. OAuth2/SAML Provider (for SSO)
**Options:**
- **Azure AD** (Microsoft)
- **Google Workspace**
- **Okta**
- **Auth0**

**Setup Example (Azure AD):**
1. Register app in Azure Portal
2. Configure redirect URLs
3. Get client ID and secret

#### 3. Additional Services (Optional)
- **Redis** (for caching) - Upstash free tier
- **File Storage** - AWS S3 or Vercel Blob
- **Email Service** - SendGrid or Resend

### Complete Environment Variables

#### Frontend (.env.local)
\`\`\`env
# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Backend API
NEXT_PUBLIC_API_URL=https://your-backend-url.com

# Optional: Socket.io
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com
\`\`\`

#### Backend (backend/.env)
\`\`\`env
# Database
DATABASE_URL=your_supabase_postgres_url
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/academichub

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRE=7d

# SSO Configuration (Choose one)
# Azure AD
OAUTH2_CLIENT_ID=your-azure-client-id
OAUTH2_CLIENT_SECRET=your-azure-client-secret
OAUTH2_AUTHORIZATION_URL=https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize
OAUTH2_TOKEN_URL=https://login.microsoftonline.com/tenant/oauth2/v2.0/token
OAUTH2_USERINFO_URL=https://graph.microsoft.com/v1.0/me
OAUTH2_CALLBACK_URL=https://your-backend-url.com/auth/oauth2/callback

# OR SAML
SAML_ENTRY_POINT=https://your-idp.com/sso/saml
SAML_ISSUER=your-app-identifier
SAML_CALLBACK_URL=https://your-backend-url.com/auth/saml/callback
SAML_CERT=your-saml-certificate

# Security
WATERMARK_SECRET=your-watermark-secret-key
FRONTEND_URL=https://your-frontend-url.com
PORT=5000
\`\`\`

### Deployment Steps (Full-Stack)

#### 1. Deploy Backend
\`\`\`bash
cd backend
npm install
npm run build

# Deploy to Railway, Render, or DigitalOcean
railway deploy
# OR
render deploy
\`\`\`

#### 2. Deploy Frontend
\`\`\`bash
npm install
npm run build
vercel --prod
\`\`\`

#### 3. Deploy Mobile App (Optional)
\`\`\`bash
cd mobile
npm install
# For iOS
npx react-native run-ios --configuration Release
# For Android
npx react-native run-android --variant=release
\`\`\`

---

## Service Setup Guides

### MongoDB Atlas Setup
1. Visit [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create account and new cluster (free M0)
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for development)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/academichub`

### Azure AD SSO Setup
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Set redirect URI: `https://your-backend-url.com/auth/oauth2/callback`
5. Copy Application (client) ID and create client secret
6. Configure API permissions for user profile access

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

---

## Troubleshooting

### Common Issues

#### 1. "Failed to initialize v0" Error
**Solution:** Missing dependencies
\`\`\`bash
npm install
cd backend && npm install
\`\`\`

#### 2. Database Connection Errors
**Solution:** Check connection strings and network access

#### 3. CORS Errors
**Solution:** Update FRONTEND_URL in backend environment

#### 4. SSO Authentication Fails
**Solution:** Verify redirect URLs match exactly

### Health Checks
- Frontend: `https://your-app.vercel.app/api/health`
- Backend: `https://your-backend.com/health`
- Database: Check Supabase dashboard

---

## Monitoring and Maintenance

### Logs
- **Vercel:** Check function logs in dashboard
- **Backend:** Use service provider logs (Railway, Render)
- **Database:** Supabase logs and MongoDB Atlas monitoring

### Backups
- **Supabase:** Automatic backups included
- **MongoDB:** Atlas automatic backups on paid tiers

### Updates
\`\`\`bash
git pull origin main
npm install
npm run build
vercel --prod
\`\`\`

---

## Support

For deployment issues:
1. Check the logs first
2. Verify all environment variables are set
3. Test database connections
4. Check service status pages

Need help? Create an issue in the repository with:
- Deployment option chosen
- Error messages
- Environment (development/production)
- Service provider used
