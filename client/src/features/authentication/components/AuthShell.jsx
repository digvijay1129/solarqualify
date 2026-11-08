import { Activity, Calculator, CircleDollarSign, FileText, Layers, Zap } from "lucide-react";
import loginRooftopImage from "../../../assets/images/solarqualify-login-rooftop-background.jpg";
import loginFoliageImage from "../../../assets/images/solarqualify-login-foliage-overlay.png";
import brandLogo from "../../../assets/images/solarqualify-brand-logo.png";

const benefitIcons = {
  calculator: Calculator,
  layers: Layers,
  subsidy: CircleDollarSign,
  quotation: FileText,
  tracking: Activity,
};

function BenefitCards({ benefits }) {
  return (
    <div className="mt-7 grid max-w-[600px] grid-cols-3 gap-3 sm:mt-8 sm:gap-4 lg:mt-6">
      {benefits.map((benefit) => {
        const Icon = benefitIcons[benefit.icon] ?? Zap;
        return (
          <div key={benefit.id} className="flex min-h-[112px] min-w-0 flex-col items-center justify-center rounded-[25px] border border-white/80 bg-white/80 px-2 py-3 text-center shadow-sm backdrop-blur-sm sm:min-h-[132px] sm:rounded-[30px] sm:px-3 sm:py-4 lg:min-h-[118px]">
            <Icon size={29} className="mb-2 shrink-0 text-green-800 sm:h-10 sm:w-10" strokeWidth={2.2} />
            <span className="text-[11px] font-extrabold leading-tight text-slate-950 sm:text-base">{benefit.title}</span>
          </div>
        );
      })}
    </div>
  );
}

function BenefitList({ benefits }) {
  return (
    <div className="mt-5 grid max-w-[620px] gap-2 sm:mt-6 sm:gap-3">
      {benefits.map((benefit) => {
        const Icon = benefitIcons[benefit.icon] ?? Zap;
        return (
          <div key={benefit.id} className="flex min-w-0 items-center gap-3">
            <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl bg-green-100/90 text-green-800 sm:h-[64px] sm:w-[64px]">
              <Icon size={29} strokeWidth={2.1} />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-extrabold leading-tight text-slate-950 sm:text-xl">{benefit.title}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-800 sm:text-base sm:leading-6">{benefit.description}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AuthShell({
  children,
  heroTitle = "Power Your Home with Solar",
  heroDescription = "Get quotations, track installation, and manage your government subsidy — all with SolarQualify.",
  benefits = [],
  benefitLayout = "cards",
  compact = false,
}) {
  const isListLayout = benefitLayout === "list";
  const rooftopHeight = isListLayout
    ? "h-[16%] sm:h-[22%] lg:h-[27%]"
    : "h-[36.3%]";

  return (
    <main className="min-h-screen overflow-x-hidden bg-brand-background">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative isolate flex min-h-[680px] flex-col overflow-hidden px-6 pb-8 pt-7 sm:px-10 sm:pt-8 lg:min-h-screen lg:px-12 lg:pb-10 lg:pt-5 xl:px-[60px]">
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,#e8f6ff_0%,#cfe9ff_34%,#fff0d9_67%,#e7f5e9_100%)]" />
          <img
            src={loginRooftopImage}
            alt="Modern home with rooftop solar panels at golden hour"
            className={`absolute inset-x-0 bottom-0 -z-10 ${rooftopHeight} w-full object-cover object-center`}
          />
          <div className={`absolute inset-x-0 bottom-0 -z-[5] ${rooftopHeight} bg-gradient-to-t from-transparent via-transparent to-amber-50/10`} />
          <img
            src={loginFoliageImage}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 -z-10 h-[190px] w-[48%] object-cover object-right-top sm:h-[220px] sm:w-[54%] lg:h-[250px] lg:w-[56%] xl:h-[270px]"
          />

          <div className="relative z-10">
            <img src={brandLogo} alt="SolarQualify — Rooftop Solar Solutions" className="h-auto w-[285px] max-w-full sm:w-[340px] lg:w-[365px]" />
            <div className="mt-10 max-w-[650px] sm:mt-12 lg:mt-[28px] xl:mt-[32px]">
              <h1 className="max-w-[650px] text-[clamp(2.7rem,4.35vw,4.15rem)] font-black leading-[0.99] tracking-[-0.045em] text-slate-950">
                {heroTitle}
              </h1>
              <div className="mt-4 h-[7px] w-[190px] rounded-full bg-gradient-to-r from-green-700 to-emerald-400 sm:mt-5 sm:w-[210px]" />
              <p className="mt-5 max-w-[610px] text-base font-medium leading-[1.35] text-slate-950 sm:text-lg sm:leading-[1.4] lg:text-[clamp(1.15rem,1.55vw,1.65rem)]">
                {heroDescription}
              </p>
            </div>
            {benefitLayout === "list" ? (
              <BenefitList benefits={benefits} />
            ) : (
              <BenefitCards benefits={benefits} />
            )}
          </div>
        </section>

        <section className={`flex min-h-screen min-w-0 items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-100 px-4 py-6 sm:px-7 sm:py-8 lg:px-7 ${compact ? "lg:py-3" : "lg:py-8 xl:py-8"}`}>
          <div className={`w-full max-w-[780px] rounded-[30px] border border-white/90 bg-white/95 px-5 py-7 shadow-[0_18px_60px_rgba(2,70,50,0.13)] backdrop-blur sm:rounded-[36px] sm:px-8 sm:py-8 ${compact ? "lg:rounded-[36px] lg:px-8 lg:py-5 xl:rounded-[40px] xl:px-9 xl:py-5" : "lg:px-9 lg:py-8 xl:rounded-[42px] xl:px-11 xl:py-9"}`}>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

export default AuthShell;
