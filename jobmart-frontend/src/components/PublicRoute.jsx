import { Navigate, Outlet } from "react-router-dom";

function PublicRoute() {
  const token =
    localStorage.getItem("jobmartToken");

  const role =
    localStorage.getItem("jobmartRole");

  if (!token) {
    return <Outlet />;
  }

  const roleRoutes = {
    Candidate: "/candidate",
    Recruiter: "/recruiter",
    HiringManager: "/manager",
    Admin: "/admin",
  };

  const destination =
    roleRoutes[role] ?? "/login";

  return (
    <Navigate
      to={destination}
      replace
    />
  );
}

export default PublicRoute;