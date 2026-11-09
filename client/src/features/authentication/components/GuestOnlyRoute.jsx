import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function GuestOnlyRoute({ children }) {
  const { user, status } = useAuth();

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-background p-6">
        <p className="text-sm font-semibold text-brand-text">Loading SolarQualify…</p>
      </main>
    );
  }

  if (status === "authenticated" && user) {
    return <Navigate to={user.role === "salesStaff" ? "/" : "/homeowner"} replace />;
  }

  return children;
}

export default GuestOnlyRoute;
