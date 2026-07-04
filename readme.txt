Production Deployment & Operations Guide
This guide provides instructions for deploying, configuring, and maintaining the SaaS School Management System in a production environment.

📋 Prerequisites
Before starting deployment, ensure the production server has the following installed:

Node.js: Version 18.x or 20.x LTS.
NPM: Version 9.x or later.
Database:
Default: SQLite (fully configured and optimized for low-to-medium tenants).
Optional: PostgreSQL (supported by switching the database provider in prisma/schema.prisma and changing the DATABASE_URL).
Process Manager: PM2 (globally installed via npm install -g pm2).
Reverse Proxy: IIS (with URL Rewrite) on Windows, or Nginx on Linux.
SSL Certificate: Let's Encrypt or a custom CA certificate.
⚙️ Environment Configuration
Create a secure .env file in the project root containing the following variables:

ini

# Server Configuration
PORT=3000
NODE_ENV=production
# Database Connection URL (SQLite path or PostgreSQL connection string)
DATABASE_URL="file:./dev.db"
# Security Configurations
JWT_SECRET="generate-a-secure-64-character-random-key"
# SMTP Mail Server Settings (For real email alerts delivery)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
SMTP_FROM="noreply@eduportal.com"
🗄️ Database Setup & Migrations
Deploy the schema migrations and generate the client on the production server:

Install production dependencies:
bash

npm ci --only=production
Apply migrations without interactive prompts:
bash

npx prisma migrate deploy
Generate Prisma Client bindings:
bash

npx prisma generate
🚀 Process Management (PM2)
Use PM2 to run the Express server as a background service that auto-restarts on server reboots or application crashes.

Start the application process:
bash

pm2 start src/server.js --name "school-system"
Save the current process list:
bash

pm2 save
Configure PM2 startup service:
On Windows, use pm2-windows-service or a Task Scheduler task.
On Linux:
bash

pm2 startup
🔒 Reverse Proxy Configuration (Nginx / IIS)
Do not expose the raw port 3000 to users. Route requests through a reverse proxy.

Nginx Example Config
nginx

server {
    listen 80;
    server_name portal.yourdomain.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name portal.yourdomain.com;
    ssl_certificate /etc/letsencrypt/live/portal.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.yourdomain.com/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
💾 Backups & Database Maintenance
Backups location: Backups are saved in the database backups directory inside the project root: c:\Users\user\Documents\Projects\school-management-system\backups\.
Execution: Backups can be triggered directly from the Developer Portal Dashboard under Database Maintenance or via cron jobs querying POST /api/developer/backup.
Restoration: Databases can be restored by uploading/choosing a backup file in the Developer Dashboard or making a POST /api/developer/restore API request.