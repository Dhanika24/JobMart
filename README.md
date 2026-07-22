# 💼 JobMart

> **Smart Recruitment. Better Connections. Faster Hiring.**

JobMart is a full-stack recruitment management system developed using **React**, **ASP.NET Core Web API**, **SQL Server**, and **Entity Framework Core**.

The platform provides dedicated portals for **Candidates**, **Recruiters**, **Hiring Managers**, and **Administrators**. It supports secure authentication, job management, applications, AI-powered candidate ranking, CV parsing, interview scheduling, candidate evaluations, notifications, system monitoring, audit logging, and recruitment analytics.

---

## ✨ Main Features

### 👨‍💻 Candidate Portal

- 🔐 Candidate registration and secure login
- 👤 Candidate profile management
- 📄 CV and document uploading
- 🤖 Automatic CV parsing and skill extraction
- 🔎 Browse and search job postings
- 📩 Apply for available jobs
- 📊 Track application status
- 🎯 AI-based job recommendations
- 📅 View interviews and notifications

### 🧑‍💼 Recruiter Portal

- 📈 Interactive recruiter dashboard
- ➕ Create, edit, and delete job postings
- 📂 View submitted job applications
- 🔍 Search and filter candidates
- 🤖 AI-powered candidate ranking
- ✅ Shortlist or reject candidates
- 📅 Schedule candidate interviews
- 🔔 Send candidate notifications
- 📊 View recruitment analytics

### 👔 Hiring Manager Portal

- ⭐ View shortlisted candidates
- 📄 Review candidate profiles and CV details
- 📆 View scheduled interviews
- 📝 Add candidate evaluations
- 💬 Record interview feedback
- 📊 Provide technical and communication scores
- 🏆 Make final hiring decisions

### 🛡️ Administrator Portal

- 👥 Manage user accounts
- ✅ Approve recruiter registrations
- 🔄 Activate or deactivate users
- 🏢 Manage organizations and departments
- 👨‍💼 Assign recruiters and hiring managers
- 📜 View system audit logs
- 🖥️ Monitor API and system health
- 📊 View recruitment reports and analytics

---

## 🛠️ Technologies Used

### 🎨 Frontend

- ⚛️ React
- ⚡ Vite
- 🟨 JavaScript
- 🎨 CSS
- 🔗 Axios
- 🧭 React Router
- ✨ Lucide React

### ⚙️ Backend

- 🟣 ASP.NET Core Web API
- 💻 C#
- 🗃️ Entity Framework Core
- 🔐 JWT Authentication
- 🔒 BCrypt Password Hashing

### 🗄️ Database

- 🧱 Microsoft SQL Server
- 🖥️ SQL Server Management Studio
- 🔄 Entity Framework Core Migrations

---

## 📁 Project Structure

```text
JobMart/
│
├── jobmart-backend/             # ⚙️ ASP.NET Core backend
│   ├── Controllers/             # API controllers
│   ├── Data/                    # Database context and seed data
│   ├── DTOs/                    # Data transfer objects
│   ├── Interfaces/              # Service interfaces
│   ├── Migrations/              # EF Core migrations
│   ├── Models/                  # Database models
│   ├── Services/                # Business logic and services
│   ├── Properties/
│   ├── Program.cs
│   ├── appsettings.json
│   └── jobmart.csproj
│
├── jobmart-frontend/            # 🎨 React frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                 # Axios configuration
│   │   ├── assets/              # Images and icons
│   │   ├── components/          # Reusable components
│   │   ├── layouts/             # Portal layouts
│   │   ├── pages/
│   │   │   ├── admin/           # Administrator pages
│   │   │   ├── auth/            # Login and registration
│   │   │   ├── candidate/       # Candidate pages
│   │   │   ├── manager/         # Hiring Manager pages
│   │   │   ├── public/          # Landing page
│   │   │   └── recruiter/       # Recruiter pages
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── .gitignore
├── jobmart.slnx
└── README.md
