# JobMart

JobMart is a full-stack recruitment management system built using React, ASP.NET Core Web API, SQL Server, and Entity Framework Core.

The platform provides separate portals for Candidates, Recruiters, Hiring Managers, and Administrators. It supports secure authentication, job management, applications, AI-based candidate ranking, CV parsing, interview scheduling, candidate evaluation, notifications, monitoring, audit logging, and recruitment analytics.

---

## Main Features

### Candidate Portal

- Candidate registration and login
- Candidate profile management
- CV and document uploading
- Automatic CV parsing and skill extraction
- Browse and search job postings
- Apply for jobs
- View application status
- AI-based job recommendations
- Interview and notification tracking

### Recruiter Portal

- Recruiter dashboard
- Create, edit, and delete job postings
- View job applications
- Search and filter candidates
- AI-based candidate ranking
- Shortlist or reject candidates
- Schedule interviews
- Send candidate notifications
- View recruitment analytics

### Hiring Manager Portal

- View shortlisted candidates
- View candidate profiles and CV details
- Review scheduled interviews
- Add candidate evaluations
- Record interview feedback
- Give technical and communication scores
- Make final hiring decisions

### Administrator Portal

- Manage user accounts
- Approve recruiter registrations
- Activate or deactivate users
- Manage organizations and departments
- Assign recruiters and hiring managers
- View audit logs
- Monitor API and system status
- View recruitment reports and analytics

---

## Technologies Used

### Frontend

- React
- Vite
- JavaScript
- CSS
- Axios
- React Router
- Lucide React

### Backend

- ASP.NET Core Web API
- C#
- Entity Framework Core
- JWT Authentication
- BCrypt password hashing

### Database

- Microsoft SQL Server
- SQL Server Management Studio
- Entity Framework Core Migrations

---

## Project Structure

```text
JobMart/
├── jobmart/
│   ├── Controllers/
│   ├── Data/
│   ├── DTOs/
│   ├── Migrations/
│   ├── Models/
│   ├── Services/
│   ├── Program.cs
│   └── jobmart.csproj
│
├── jobmart-frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── jobmart.slnx
└── README.md
