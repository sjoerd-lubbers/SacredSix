# Sacred Six

A productivity and personal development application focused on the concept of completing six important tasks each day.

## Overview

Sacred Six is a full-stack web application designed to help users focus on their most important tasks each day. The application allows users to:

- Track and complete six important tasks daily
- Organize tasks into projects
- Write and analyze reflections
- View productivity statistics and insights
- Share tasks and projects with others
- Export and import data for backup and portability

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- Recharts for data visualization

### Backend
- Node.js
- Express
- MongoDB
- JWT for authentication

## Features

### Task Management
- Create, edit, and delete tasks
- Organize tasks into projects
- Select six important tasks for each day
- Track task completion and progress

### Projects
- Create and manage projects
- View project-specific tasks
- Share projects with other users
- Collaborate on shared projects

### Reflections
- Write daily and weekly reflections
- AI-powered analysis of reflections
- Receive suggestions based on reflection content

### Dashboard
- View completion rate statistics
- Track productivity trends
- See task status distribution
- Get feedback based on completion rate

### Data Management
- Export all user data to JSON
- Import data from previous exports
- Backup and restore functionality

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/sacred-six.git
cd sacred-six
```

2. Install backend dependencies
```
cd backend
npm install
```

3. Set up environment variables
Create a `.env` file in the backend directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Install frontend dependencies
```
cd ../frontend
npm install
```

5. Start the development servers

Backend:
```
cd backend
npm run dev
```

Frontend:
```
cd frontend
npm run dev
```

6. Access the application at `http://localhost:3000`

## License

[MIT](LICENSE)
