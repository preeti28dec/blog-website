# Blog Website - Full Stack Next.js Application

A modern, full-stack blogging website built with Next.js 14, TypeScript, Prisma, and Tailwind CSS.

## 🚀 Features

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with Prisma ORM
- **Database**: MongoDB (MongoDB Atlas recommended for production)
- **Authentication**: NextAuth.js with JWT strategy
- **Image Upload**: Cloudinary integration
- **Admin Panel**: Create, view, and delete blog posts
- **Responsive Design**: Modern UI that works on all devices

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm
- Git

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database (MongoDB Atlas connection string)
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# JWT Secret (for custom auth endpoints)
JWT_SECRET="your-jwt-secret-key-here"

# Cloudinary Configuration (for image uploads)
# Option 1: Use CLOUDINARY_URL (recommended)
CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"

# Option 2: Use individual variables
# CLOUDINARY_CLOUD_NAME="your-cloud-name"
# CLOUDINARY_API_KEY="your-api-key"
# CLOUDINARY_API_SECRET="your-api-secret"

# Email Configuration (for contact form)
# SMTP settings for sending emails via nodemailer
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Note: For Gmail, you need to use an App Password, not your regular password
# 1. Enable 2-Step Verification on your Google Account
# 2. Go to Google Account > Security > App Passwords
# 3. Generate an app password for "Mail"
# 4. Use that app password as SMTP_PASS

# App
NODE_ENV="development"
```

**To get Cloudinary credentials:**
1. Sign up for a free account at [cloudinary.com](https://cloudinary.com)
2. Go to your Dashboard
3. Copy your `Cloud name`, `API Key`, and `API Secret`
4. Add them to your `.env` file

**To generate a secure NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Set Up Database

**For MongoDB Atlas (Recommended):**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Create a database user and get your connection string
4. Add your IP address to the Network Access whitelist (or use 0.0.0.0/0 for development)
5. Copy your connection string and add it to `.env` as `DATABASE_URL`

**Generate Prisma Client and Push Schema:**
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Create Your First User

You can create a user through the registration page at `/login` or use Prisma Studio:

```bash
npm run db:studio
```

This opens Prisma Studio where you can manually create users.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
Blog-website/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── posts/         # Blog post endpoints
│   │   └── auth/          # Authentication endpoints
│   ├── admin/             # Admin dashboard
│   ├── login/             # Login/Register page
│   ├── posts/             # Blog post pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── Navbar.tsx         # Navigation bar
├── lib/                   # Utility functions
│   ├── prisma.ts          # Prisma client
│   └── posts.ts           # Post helper functions
├── prisma/                # Database schema
│   └── schema.prisma      # Prisma schema
└── public/                # Static assets
```

## 🔌 API Endpoints

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/[slug]` - Get a single post
- `PUT /api/posts/[slug]` - Update a post
- `DELETE /api/posts/[slug]` - Delete a post

### Authentication
- `POST /api/auth/register` - Register a new user

## 💰 Budget Breakdown

### Development Phase (Free to Low Cost)

#### 1. **Development Tools** - FREE
- **VS Code / Cursor**: Free code editor
- **Git & GitHub**: Free version control
- **Node.js**: Free runtime

#### 2. **Local Development** - FREE
- SQLite database: Free (included)
- Local development server: Free

### Production Deployment Costs

#### Option 1: Vercel (Recommended for Next.js) - **FREE to $20/month**

**Free Tier:**
- Hosting: FREE
- Bandwidth: 100GB/month
- Builds: Unlimited
- Custom domain: FREE
- SSL: FREE

**Pro Plan ($20/month):**
- Everything in free tier
- More bandwidth
- Team collaboration
- Analytics

#### Option 2: Self-Hosted VPS - **$5-20/month**

**Providers:**
- **DigitalOcean**: $6/month (Basic Droplet)
- **Linode**: $5/month
- **Vultr**: $6/month
- **AWS Lightsail**: $5/month

**Additional Costs:**
- Domain name: $10-15/year (Namecheap, GoDaddy, Google Domains)
- SSL Certificate: FREE (Let's Encrypt)

#### Option 3: Database Hosting (if not using SQLite)

**PostgreSQL Options:**
- **Supabase**: FREE tier (500MB database, 2GB bandwidth)
- **Neon**: FREE tier (0.5GB storage)
- **Railway**: $5/month
- **PlanetScale**: FREE tier (5GB storage)

### Total Estimated Costs

**Minimum (Free):**
- Vercel Free Tier: $0
- SQLite (local): $0
- Domain (optional): $0-15/year
- **Total: $0-15/year**

**Recommended (Production Ready):**
- Vercel Pro: $20/month
- PostgreSQL (Supabase Free): $0
- Domain: $12/year
- **Total: ~$252/year ($21/month)**

**Self-Hosted Option:**
- VPS: $6/month
- Domain: $12/year
- **Total: ~$84/year ($7/month)**

## 🚀 Deployment Guide

### Deploy to Vercel (Recommended)

#### Prerequisites
1. Push your code to GitHub
2. Have your MongoDB Atlas connection string ready
3. Have your Cloudinary credentials ready
4. Generate a secure `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

#### Step-by-Step Deployment

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign up/Login with your GitHub account

2. **Import Your Repository**
   - Click "Add New Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   In the Vercel dashboard, add these environment variables:
   
   **Required:**
   - `DATABASE_URL` - Your MongoDB Atlas connection string
   - `NEXTAUTH_URL` - Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET` - A secure random string (use the one you generated)
   - `JWT_SECRET` - A secure random string (can be same as NEXTAUTH_SECRET)
   
   **For Image Uploads:**
   - `CLOUDINARY_URL` - Your Cloudinary connection string
   - OR use individual variables:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically:
     - Run `npm install`
     - Run `prisma generate` (via postinstall script)
     - Run `npm run build`
     - Deploy your application

5. **Post-Deployment**
   - After deployment, run database migrations:
     ```bash
     # Connect to your Vercel project via CLI or use MongoDB Atlas directly
     npx prisma db push
     ```
   - Or use Prisma Studio locally with your production DATABASE_URL

#### Important Notes for Vercel Deployment

- **MongoDB Atlas Network Access**: Make sure to whitelist Vercel's IP addresses or use `0.0.0.0/0` (allow all IPs) for your MongoDB Atlas cluster
- **NEXTAUTH_URL**: After first deployment, update this to your actual Vercel URL
- **Build Time**: The build process includes Prisma client generation automatically
- **Serverless Functions**: All API routes run as serverless functions on Vercel
- **Environment Variables**: Never commit `.env` file - always use Vercel's environment variables dashboard

#### Troubleshooting Vercel Deployment

**Build Fails:**
- Check that all environment variables are set
- Verify `DATABASE_URL` format is correct
- Check build logs for specific errors

**Database Connection Issues:**
- Verify MongoDB Atlas Network Access allows all IPs (0.0.0.0/0)
- Check DATABASE_URL is correctly formatted
- Ensure database user has proper permissions

**NextAuth Not Working:**
- Verify `NEXTAUTH_URL` matches your Vercel deployment URL
- Ensure `NEXTAUTH_SECRET` is set
- Check that callback URLs are correct

### Deploy to VPS

1. Set up a VPS (Ubuntu recommended)
2. Install Node.js and npm
3. Clone your repository
4. Install dependencies: `npm install`
5. Set up environment variables
6. Run database migrations: `npm run db:push`
7. Build the app: `npm run build`
8. Use PM2 to run: `pm2 start npm --name "blog" -- start`
9. Set up Nginx as reverse proxy
10. Configure SSL with Let's Encrypt

## 🔐 Security Notes

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Change NEXTAUTH_SECRET** in production
3. **Use strong passwords** for database
4. **Enable HTTPS** in production
5. **Regular updates** - Keep dependencies updated

## 📝 Next Steps

1. **Complete Authentication**: Integrate NextAuth.js for full login system
2. **Add Comments**: Integrate Disqus or build custom
3. **SEO Optimization**: Add meta tags, sitemap
4. **Email Notifications**: Use SendGrid or Resend
5. **Analytics**: Add Google Analytics or Vercel Analytics

## 🐛 Troubleshooting

### Database Issues

**MongoDB Connection Issues:**
```bash
# Regenerate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Check connection
npm run db:studio
```

**Common MongoDB Atlas Issues:**
- **Connection timeout**: Check Network Access whitelist in MongoDB Atlas
- **Authentication failed**: Verify username and password in DATABASE_URL
- **Database not found**: The database will be created automatically on first connection

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Prisma Client Issues
```bash
npm run db:generate
```

### Image Upload Issues

If you're getting "Upload failed: Failed to upload image" error:

1. **Check Cloudinary Environment Variables:**
   - Make sure you have `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in your `.env` file
   - Restart your development server after adding environment variables
   - Verify the values are correct (no extra spaces or quotes)

2. **Verify Cloudinary Account:**
   - Log in to [Cloudinary Dashboard](https://cloudinary.com/console)
   - Check that your account is active
   - Verify your API credentials match what's in your `.env` file

3. **Check Server Logs:**
   - Look at your terminal/console for detailed error messages
   - The improved error handling will show specific issues like "Invalid API Key" or "Cloud name is missing"

4. **Test Authentication:**
   - Make sure you're logged in as an admin/user
   - Image uploads require authentication

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Happy Coding! 🎉**




