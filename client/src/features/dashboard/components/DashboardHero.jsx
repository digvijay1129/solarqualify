import heroImage from "../../../assets/images/solarqualify-hero-rooftop.jpg";

function DashboardHero() {
  return (
    <section
      aria-label="Solar business overview"
      className="relative flex min-h-[116px] items-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#E3F8DF] via-[#E5F8F1] to-[#DDF4FA] px-4 py-4 sm:h-[102px] sm:min-h-0 sm:px-7 sm:py-0"
    >
      <img
        src={heroImage}
        alt="Residential rooftop fitted with solar panels"
        className="absolute right-0 top-0 h-full w-[43%] object-cover object-right sm:w-[52%]"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#E3F8DF] via-[#E3F8DF]/95 to-transparent sm:via-[#E5F8F1]/35" />

      <div className="relative z-10 w-[68%] sm:w-auto">
        <h2 className="text-base font-bold leading-5 tracking-tight text-[#063B25] sm:text-2xl sm:leading-tight">
          Good Morning, Digvijay <span aria-hidden="true">👋</span>
        </h2>

        <p className="mt-1 text-xs font-medium leading-4 text-[#234B3A] sm:text-base sm:leading-normal">
          Here's your solar business overview for today.
        </p>
      </div>
    </section>
  );
}

export default DashboardHero;