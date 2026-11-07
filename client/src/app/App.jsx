import { Sun, ArrowUpRight } from "lucide-react";

function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-background p-6">
      <section className="w-full max-w-xl rounded-2xl border border-brand-border bg-white p-10 shadow-card">

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-forest text-white">
            <Sun size={26} />
          </div>

          <span className="text-2xl font-bold text-brand-forest">
            SolarQualify
          </span>
        </div>

        <span className="inline-flex rounded-full bg-brand-mint-soft px-3 py-1 text-xs font-semibold text-brand-emerald">
          Frontend Foundation
        </span>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-brand-text">
          Welcome to SolarQualify
        </h1>

        <p className="mt-3 leading-7 text-brand-muted">
          Your rooftop solar management platform is being prepared.
          We are building a clean, professional experience for homeowners
          and solar sales teams.
        </p>

        <div className="mt-8 flex items-center justify-between rounded-xl bg-brand-mint-soft p-4">
          <div>
            <p className="font-semibold text-brand-forest">
              Development foundation ready
            </p>
            <p className="mt-1 text-sm text-brand-muted">
              React + Vite + Tailwind CSS
            </p>
          </div>

          <ArrowUpRight className="text-brand-emerald" size={24} />
        </div>

        <p className="mt-8 text-xs text-brand-muted">
          SolarQualify · Rooftop Solar Solutions
        </p>

      </section>
    </main>
  );
}

export default App;