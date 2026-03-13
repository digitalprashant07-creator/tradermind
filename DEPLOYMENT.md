# Deploying TraderMind to Render

This guide provides step-by-step instructions to deploy the TraderMind trading journal application to Render.

## Prerequisites

- GitHub account with your TraderMind repository pushed
- Render account (free tier available at [render.com](https://render.com))

## Step 1: Prepare Your Code

### Fix Build Issues Locally

Before deploying, ensure the build works on your local machine:

```bash
cd tradermind
npm install
npm run build
```

If the build fails, check the error messages and fix any issues. The build should create a `dist/` folder with the compiled application.

### Push Code to GitHub

Ensure all your changes are committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## Step 2: Create Render PostgreSQL Database

1. Go to [render.com](https://render.com) and sign in to your account
2. Click the "New" button in the top right corner
3. Select "PostgreSQL" from the dropdown menu
4. Configure your database:
   - **Name**: `tradermind-db` (or any name you prefer)
   - **Database**: Leave as default or set to `tradermind`
   - **Region**: Choose the region closest to your users
   - **Plan**: Select the free tier or a paid plan based on your needs
5. Click "Create Database"
6. Wait for the database to be created (this may take a few minutes)
7. **Important**: Copy the `External Database URL` - you'll need this for your application

## Step 3: Create Render Web Service

1. In your Render dashboard, click "New" → "Web Service"
2. Connect your GitHub repository:
   - Click "Connect" next to your TraderMind repository
   - If you don't see it, click "Configure account" to connect your GitHub account
3. Configure the web service:
   - **Name**: `tradermind` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose the same region as your database
   - **Branch**: `main` (or your deployment branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

## Step 4: Configure Environment Variables

In your Render web service settings, add the following environment variables:

| Key | Value | Description |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Your Render PostgreSQL connection string |
| `SESSION_SECRET` | `your-random-secret-here` | Random string for session security (generate with `openssl rand -base64 32`) |
| `NODE_ENV` | `production` | Sets the environment to production |
| `PORT` | `10000` | Render's default port (optional, Render sets this automatically) |

## Step 5: Deploy Your Application

1. Click "Create Web Service"
2. Render will start building your application
3. Monitor the build logs for any errors
4. Once the build completes successfully, your app will be deployed
5. You'll receive a URL like `https://tradermind.onrender.com`

## Step 6: Set Up Database Tables

After deployment, you need to create the database tables:

1. In your Render dashboard, go to your web service
2. Click the "Shell" tab
3. Run the database migration command:
   ```bash
   npm run db:push
   ```
4. This will create all required tables in your PostgreSQL database

## Step 7: Verify Deployment

1. Visit your Render URL in a web browser
2. Try registering a new user account
3. Test the main features:
   - User registration/login
   - Adding trades
   - Viewing analytics
   - Managing money transactions

## Database Management

### Using Render's Built-in Database Dashboard

1. In your Render dashboard, go to your PostgreSQL database
2. Click the "Dashboard" tab
3. You can:
   - View all tables and their data
   - Run custom SQL queries
   - Monitor database performance
   - See connection details

### Using External Database Tools

You can connect to your Render PostgreSQL database using tools like:

- **pgAdmin**: Free PostgreSQL management tool
- **DBeaver**: Universal database client
- **TablePlus**: Modern database interface
- **DataGrip**: JetBrains database IDE

Use your `DATABASE_URL` connection string to connect.

### Command Line Access

```bash
# Connect to your database
psql "your-database-url"

# Useful commands
\l              # List databases
\dt             # List tables
\d users        # Describe users table
SELECT * FROM users;  # View user data
```

## Troubleshooting

### Build Failures
- Check the build logs in Render for specific error messages
- Ensure all dependencies are listed in `package.json`
- Verify that the build script works locally

### Database Connection Issues
- Double-check your `DATABASE_URL` environment variable
- Ensure the database is in the same region as your web service
- Verify that the database is not paused (free tier databases sleep after inactivity)

### Application Errors
- Check the application logs in Render
- Ensure all environment variables are set correctly
- Verify that database tables were created successfully

### Performance Issues
- Free tier applications "spin down" after 15 minutes of inactivity
- First load after spin-down may take 10-30 seconds
- Consider upgrading to a paid plan for better performance

## Environment Variables Reference

```bash
# Required
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-secure-random-string-here

# Optional (Render sets automatically)
NODE_ENV=production
PORT=10000
```

## Post-Deployment Tasks

1. **Set up monitoring**: Configure Render's monitoring alerts
2. **Configure custom domain**: Add your own domain if desired
3. **Set up backups**: Configure automated database backups
4. **Optimize performance**: Monitor and optimize slow queries
5. **Security**: Regularly update dependencies and monitor for vulnerabilities

## Support

- Render Documentation: https://docs.render.com/
- TraderMind Issues: Check GitHub repository issues
- PostgreSQL Documentation: https://www.postgresql.org/docs/

Your TraderMind application is now live and ready to use! 🚀