const styles = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-green-200 bg-green-50 text-green-900",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  error: "border-red-200 bg-red-50 text-red-900",
};

function AuthNotice({ tone = "info", children }) {
  if (!children) return null;

  return (
    <div role="status" aria-live="polite" className={`rounded-xl border px-3.5 py-3 text-sm leading-5 ${styles[tone] ?? styles.info}`}>
      {children}
    </div>
  );
}

export default AuthNotice;
