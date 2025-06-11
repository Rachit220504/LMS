# Learning Management System (LMS)

A modern, full-featured learning management system built with Next.js 14, TypeScript, Prisma, and Tailwind CSS. This platform enables educational institutions to manage courses, assignments, enrollments, and user accounts with a clean and responsive user interface.


## Features

- **Multi-role Authentication**: Support for students, teachers, and administrators
- **Course Management**: Create, update, and manage courses with rich content
- **Assignment Handling**: Create assignments, submit work, and grade submissions
- **User Dashboard**: Role-specific dashboards with analytics and activity tracking
- **Enrollment System**: Students can enroll in courses, track progress
- **Materials Management**: Upload and organize course materials
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Analytics**: Detailed analytics for administrators and teachers
- **Real-time Notifications**: Stay updated with course activities

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, Node.js
- **Database**: PostgreSQL (supports MySQL/SQLite too)
- **Authentication**: NextAuth.js
- **Data Visualization**: Recharts
- **File Storage**: Local storage (configurable for cloud providers)
- **Form Handling**: React Hook Form, Zod validation

## Prerequisites

- Node.js 18+ 
- PostgreSQL or another database supported by Prisma
- npm or yarn package manager

## Installation

1. Clone the repository
```bash
git clone https://github.com/Rachit220504/LMS.git
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables (copy the sample .env file)
```bash
cp .env.example .env
```

4. Update the `.env` file with your database connection string and other required variables

5. Run Prisma migrations to set up your database
```bash
npx prisma migrate dev
# or
yarn prisma migrate dev
```

6. Seed the database with initial data (optional)
```bash
npx prisma db seed
# or
yarn prisma db seed
```

## Running the Development Server

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/lms?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (for password reset)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@example.com"
EMAIL_SERVER_PASSWORD="your-email-password"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_SERVER_SECURE="false"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```


