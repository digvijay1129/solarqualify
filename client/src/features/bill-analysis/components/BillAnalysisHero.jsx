import { FileSearch } from "lucide-react";
import heroImage from "../../../assets/images/solarqualify-hero-rooftop.jpg";

function BillAnalysisHero() {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-brand-border bg-[#EDF9F0]">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-right bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(90deg, #EDF9F0 0%, rgba(237,249,240,0.98) 35%, rgba(237,249,240,0.65) 56%, rgba(237,249,240,0.02) 78%), url(${heroImage})`,
        }}
        aria-hidden="true"
      />

      <div className="flex min-h-[112px] items-center gap-4 px-4 py-5 sm:min-h-[126px] sm:px-7">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100 text-brand-forest sm:h-16 sm:w-16">
          <FileSearch size={35} strokeWidth={1.9} aria-hidden="true" />
        </div>

        <div className="min-w-0 max-w-2xl">
          <h2 className="text-xl font-extrabold tracking-tight text-brand-text sm:text-2xl lg:text-[28px]">
            Electricity Bill Analysis
          </h2>

          <p className="mt-1 text-xs leading-5 text-brand-text sm:text-sm">
            Upload a customer's electricity bill, extract key details, and
            verify the information before creating a solar quotation.
          </p>
        </div>
      </div>
    </section>
  );
}

export default BillAnalysisHero;