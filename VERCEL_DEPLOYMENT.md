# Vercel Deployment Checklist

This guide ensures your blog website is ready for Vercel deployment.

## ✅ Pre-Deployment Checklist

### 1. Code Preparation
- [x] All code is committed to Git
- [x] Code is pushed to GitHub
- [x] No console errors in development
- [x] Build completes successfully locally (or at least no code errors)

### 2. Environment Variables Required

Make sure you have these ready before deploying:

#### Database
- [ ] `DATABASE_URL` - MongoDB Atlas connection string
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`
  - Get from: MongoDB Atlas Dashboard → Connect → Connect your application

#### Authentication
- [ ] `NEXTAUTH_URL` - Your production URL (will be `https://your-app.vercel.app`)
- [ ] `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- [ ] `JWT_SECRET` - Generate with: `openssl rand -base64 32` (can be same as NEXTAUTH_SECRET)

#### Image Upload (Cloudinary)
- [ ] `CLOUDINARY_URL` - Full connection string
  - Format: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`
  - OR use individual variables:
    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`

### 3. MongoDB Atlas Setup

- [ ] MongoDB Atlas account created
- [ ] Cluster created (free tier is fine)
- [ ] Database user created with read/write permissions
- [ ] Network Access configured:
  - For development: Add your current IP
  - For Vercel: Add `0.0.0.0/0` (allow all IPs) OR add Vercel's IP ranges
- [ ] Connection string copied

### 4. Cloudinary Setup

- [ ] Cloudinary account created
- [ ] API credentials obtained
- [ ] Connection string or individual credentials ready

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your repository
5. Vercel will auto-detect Next.js

### Step 3: Configure Environment Variables

In Vercel project settings → Environment Variables, add:

```
DATABASE_URL=mongodb+srv://...
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-generated-secret
JWT_SECRET=your-generated-secret
CLOUDINARY_URL=cloudinary://...
```

**Important:** 
- Don't add quotes around values
- For `NEXTAUTH_URL`, use your actual Vercel URL after first deployment
- You can update `NEXTAUTH_URL` after deployment

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Note your deployment URL

### Step 5: Update NEXTAUTH_URL

After first deployment:
1. Go to Vercel project settings
2. Environment Variables
3. Update `NEXTAUTH_URL` to your actual Vercel URL: `https://your-app.vercel.app`
4. Redeploy (or it will auto-redeploy)

### Step 6: Initialize Database

After deployment, initialize your database:

**Option 1: Using Prisma Studio locally**
```bash
# Set DATABASE_URL to your production URL temporarily
export DATABASE_URL="your-production-mongodb-url"
npx prisma studio
# Create your first admin user through the UI
```

**Option 2: Using MongoDB Atlas directly**
- Go to MongoDB Atlas Dashboard
- Use the Data Explorer to create your first user

**Option 3: Using your app**
- Visit your deployed app
- Go to `/login`
- Register your first user
- Update user role to ADMIN in MongoDB Atlas if needed

## 🔍 Post-Deployment Verification

### Check These URLs:

- [ ] Homepage loads: `https://your-app.vercel.app`
- [ ] Login page works: `https://your-app.vercel.app/login`
- [ ] API routes respond: `https://your-app.vercel.app/api/posts`
- [ ] Sitemap accessible: `https://your-app.vercel.app/sitemap.xml`
- [ ] Robots.txt accessible: `https://your-app.vercel.app/robots.txt`

### Test Functionality:

- [ ] User registration works
- [ ] User login works
- [ ] Can create blog posts (if admin)
- [ ] Can view blog posts
- [ ] Image upload works (if configured)
- [ ] Comments work (if implemented)

## 🐛 Common Issues & Solutions

### Issue: Build Fails
**Solution:**
- Check Vercel build logs
- Ensure all environment variables are set
- Verify `DATABASE_URL` format is correct
- Check that Prisma schema is valid

### Issue: Database Connection Error
**Solution:**
- Verify MongoDB Atlas Network Access allows `0.0.0.0/0`
- Check `DATABASE_URL` is correct (no extra spaces/quotes)
- Verify database user has proper permissions
- Check MongoDB Atlas cluster is running

### Issue: NextAuth Not Working
**Solution:**
- Verify `NEXTAUTH_URL` matches your Vercel URL exactly
- Ensure `NEXTAUTH_SECRET` is set
- Check that callback URLs are correct
- Clear browser cookies and try again

### Issue: Images Not Uploading
**Solution:**
- Verify Cloudinary credentials are correct
- Check `CLOUDINARY_URL` format
- Ensure Cloudinary account is active
- Check API key permissions in Cloudinary dashboard

### Issue: 500 Errors on API Routes
**Solution:**
- Check Vercel function logs
- Verify database connection
- Check environment variables are set
- Look for specific error messages in logs

## 📝 Environment Variables Reference

### Required for Production:
```env
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/dbname
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=base64-encoded-secret-32-chars-min
JWT_SECRET=base64-encoded-secret-32-chars-min
```

### Optional (for image uploads):
```env
CLOUDINARY_URL=cloudinary://key:secret@cloudname
# OR
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🎉 Success!

Once everything is working:
- [ ] Update your domain (if you have one)
- [ ] Set up custom domain in Vercel
- [ ] Update `NEXTAUTH_URL` to your custom domain
- [ ] Test all functionality
- [ ] Monitor Vercel analytics

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

