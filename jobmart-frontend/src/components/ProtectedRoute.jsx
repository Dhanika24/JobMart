import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute({ allowedRoles }) {
  const token =
    localStorage.getItem("jobmartToken");

  const role =
    localStorage.getItem("jobmartRole");

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    Array.isArray(allowedRoles) &&
    !allowedRoles.includes(role)
  ) {
    const roleRoutes = {
      Candidate: "/candidate",
      Recruiter: "/recruiter",
      HiringManager: "/manager",
      Admin: "/admin",
    };

    const correctRoute =
      roleRoutes[role] ?? "/login";

    return (
      <Navigate
        to={correctRoute}
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;