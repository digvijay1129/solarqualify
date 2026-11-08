import { FileSpreadsheet } from "lucide-react";
import heroImage from "../../../assets/images/solarqualify-hero-rooftop.jpg";

function QuotationBuilderHero() {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-brand-border bg-[#EDF9F0]">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-right bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(90deg, #EDF9F0 0%, rgba(237,249,240,0.98) 36%, rgba(237,249,240,0.68) 60%, rgba(237,249,240,0.03) 82%), url(${heroImage})`,
        }}
        aria-hidden="true"
      />
      <div className="flex min-h-[104px] items-center gap-4 px-4 py-5 sm:min-h-[112px] sm:px-7">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100 text-brand-forest sm:h-16 sm:w-16">
          <FileSpreadsheet size={36} strokeWidth={1.9} aria-hidden="true" />
        </div>
        <div className="min-w-0 max-w-3xl">
          <h2 className="text-xl font-extrabold tracking-tight text-brand-text sm:text-2xl lg:text-[28px]">
            Create Solar Quotation
          </h2>
          <p className="mt-1 text-xs leading-5 text-brand-text sm:text-sm">
            Configure system size, pricing and subsidy to prepare a professional quotation.
          </p>
        </div>
      </div>
    </section>
  );
}

export default QuotationBuilderHero;
