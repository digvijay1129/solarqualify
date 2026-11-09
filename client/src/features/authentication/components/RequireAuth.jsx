import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function homePathForRole(role) {
  return role === "salesStaff" ? "/" : "/homeowner";
}

function RequireAuth({ allowedRoles, children }) {
  const location = useLocation();
  const { user, status, sessionError, refreshSession } = useAuth();

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-background p-6">
        <p className="text-sm font-semibold text-brand-text">Checking your SolarQualify session…</p>
      </main>
    );
  }

  if (status === "unavailable") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-background p-6">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-extrabold text-brand-text">Could not verify your session</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{sessionError}</p>
          <button
            type="button"
            onClick={() => void refreshSession()}
            className="mt-5 min-h-11 w-full rounded-xl bg-brand-forest px-4 py-2 text-sm font-bold text-white hover:bg-brand-emerald"
          >
            Retry connection
          </button>
          <Link to="/login" className="mt-3 block text-center text-sm font-bold text-brand-forest hover:underline">
            Go to sign in
          </Link>
        </section>
      </main>
    );
  }

  if (status !== "authenticated" || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return children;
}

export default RequireAuth;
