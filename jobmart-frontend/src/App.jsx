import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

import LandingPage from "./pages/public/LandingPage";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import CandidateLayout from "./layouts/CandidateLayout";
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import BrowseJobs from "./pages/candidate/BrowseJobs";
import MyApplications from "./pages/candidate/MyApplications";
import MyInterviews from "./pages/candidate/MyInterviews";
import Notifications from "./pages/candidate/Notifications";
import MyProfile from "./pages/candidate/MyProfile";
import MyCVs from "./pages/candidate/MyCVs";
import JobRecommendations from "./pages/candidate/JobRecommendations";
import CandidateDocuments from "./pages/candidate/CandidateDocuments";

import RecruiterLayout from "./layouts/RecruiterLayout";
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import JobPostings from "./pages/recruiter/JobPostings";
import RecruiterApplications from "./pages/recruiter/RecruiterApplications";
import AIRankings from "./pages/recruiter/AIRankings";
import RecruiterInterviews from "./pages/recruiter/RecruiterInterviews";
import RecruiterCommunication from "./pages/recruiter/RecruiterCommunication";
import RecruiterAnalytics from "./pages/recruiter/RecruiterAnalytics";

import HiringManagerLayout from "./layouts/HiringManagerLayout";
import HiringManagerDashboard from "./pages/manager/HiringManagerDashboard";
import ShortlistedCandidates from "./pages/manager/ShortlistedCandidates";
import CandidateEvaluations from "./pages/manager/CandidateEvaluations";
import InterviewFeedback from "./pages/manager/InterviewFeedback";
import HiringDecisions from "./pages/manager/HiringDecisions";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import PendingRecruiters from "./pages/admin/PendingRecruiters";
import CreateStaffAccount from "./pages/admin/CreateStaffAccount";
import OrganizationManagement from "./pages/admin/OrganizationManagement";
import DepartmentManagement from "./pages/admin/DepartmentManagement";
import StaffAssignmentManagement from "./pages/admin/StaffAssignmentManagement";
import SystemMonitoring from "./pages/admin/SystemMonitoring";
import SystemReports from "./pages/admin/SystemReports.jsx";

function App() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route
        path="/"
        element={<LandingPage />}
      />

      {/* Login and registration */}
      <Route element={<PublicRoute />}>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />
      </Route>

      {/* Candidate portal */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={["Candidate"]}
          />
        }
      >
        <Route
          path="/candidate"
          element={<CandidateLayout />}
        >
          <Route
            index
            element={<CandidateDashboard />}
          />

          <Route
            path="profile"
            element={<MyProfile />}
          />

          <Route
            path="jobs"
            element={<BrowseJobs />}
          />

          <Route
            path="recommendations"
            element={<JobRecommendations />}
          />

          <Route
            path="applications"
            element={<MyApplications />}
          />

          <Route
            path="resumes"
            element={<MyCVs />}
          />

          <Route
            path="documents"
            element={<CandidateDocuments />}
          />

          <Route
            path="interviews"
            element={<MyInterviews />}
          />

          <Route
            path="notifications"
            element={<Notifications />}
          />
        </Route>
      </Route>

      {/* Recruiter portal */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={["Recruiter"]}
          />
        }
      >
        <Route
          path="/recruiter"
          element={<RecruiterLayout />}
        >
          <Route
            index
            element={<RecruiterDashboard />}
          />

          <Route
            path="jobs"
            element={<JobPostings />}
          />

          <Route
            path="applications"
            element={<RecruiterApplications />}
          />

          <Route
            path="rankings"
            element={<AIRankings />}
          />

          <Route
            path="interviews"
            element={<RecruiterInterviews />}
          />

          <Route
            path="communication"
            element={<RecruiterCommunication />}
          />

          <Route
            path="analytics"
            element={<RecruiterAnalytics />}
          />
        </Route>
      </Route>

      {/* Hiring Manager portal */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={["HiringManager"]}
          />
        }
      >
        <Route
          path="/manager"
          element={<HiringManagerLayout />}
        >
          <Route
            index
            element={<HiringManagerDashboard />}
          />

          <Route
            path="candidates"
            element={<ShortlistedCandidates />}
          />

          <Route
            path="evaluations"
            element={<CandidateEvaluations />}
          />

          <Route
            path="interviews"
            element={<InterviewFeedback />}
          />

          <Route
            path="decisions"
            element={<HiringDecisions />}
          />
        </Route>
      </Route>

      {/* Administrator portal */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={["Admin"]}
          />
        }
      >
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          <Route
            index
            element={<AdminDashboard />}
          />

          <Route
            path="users"
            element={<UserManagement />}
          />

          <Route
            path="pending-recruiters"
            element={<PendingRecruiters />}
          />

          <Route
            path="create-staff"
            element={<CreateStaffAccount />}
          />

          <Route
            path="organizations"
            element={<OrganizationManagement />}
          />

          <Route
            path="departments"
            element={<DepartmentManagement />}
          />

          <Route
            path="staff-assignments"
            element={<StaffAssignmentManagement />}
          />

          <Route
            path="system-monitoring"
            element={<SystemMonitoring />}
          />

          <Route
            path="reports"
            element={<SystemReports />}
          />
        </Route>
      </Route>

      {/* Unknown routes */}
      <Route
        path="*"
        element={
          <Navigate to="/" replace />
        }
      />
    </Routes>
  );
}

export default App;