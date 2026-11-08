import { Coins } from "lucide-react";
import heroImage from "../../../assets/images/solarqualify-hero-rooftop.jpg";

function PricingSubsidyHero() {
  return (
    <section className="relative isolate flex min-h-[88px] min-w-0 items-center overflow-hidden rounded-2xl border border-brand-border bg-gradient-to-r from-brand-mint-soft via-white to-sky-50 px-5 py-4 shadow-sm sm:min-h-[104px] sm:px-7">
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-[55%] bg-cover bg-center opacity-90"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(235,250,237,1) 0%, rgba(235,250,237,.3) 32%, rgba(255,255,255,0) 100%), url(${heroImage})` }}
      />
      <div className="relative z-10 flex min-w-0 items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100 text-brand-emerald sm:h-16 sm:w-16">
          <Coins size={34} strokeWidth={2.1} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight text-brand-text sm:text-2xl">
            Manage Pricing and Government Subsidy
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-brand-text sm:text-sm">
            Configure approved equipment rates, installation charges and subsidy rules used in quotations.
          </p>
        </div>
      </div>
    </section>
  );
}

export default PricingSubsidyHero;
