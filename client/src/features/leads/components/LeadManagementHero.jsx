import heroImage from "../../../assets/images/solarqualify-hero-rooftop.jpg";

function LeadManagementHero() {
  return (
    <section
      aria-label="Lead management overview"
      className="relative flex min-h-[116px] items-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#E3F8DF] via-[#E5F8F1] to-[#DDF4FA] px-4 py-4 sm:h-[102px] sm:min-h-0 sm:px-7 sm:py-0"
    >
      <img
        src={heroImage}
        alt="Residential rooftop fitted with solar panels"
        className="absolute right-0 top-0 h-full w-[40%] object-cover object-right sm:w-[42%]"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#E3F8DF] via-[#E3F8DF]/95 to-transparent sm:via-[#E5F8F1]/35" />

      <div className="relative z-10 mr-2 h-12 w-1.5 shrink-0 rounded-full bg-[#079447] sm:mr-4 sm:h-14 sm:w-[7px]" />

      <div className="relative z-10 w-[72%] sm:w-auto">
        <h2 className="text-xl font-bold leading-6 tracking-tight text-[#101828] sm:text-3xl sm:leading-tight">
          Lead Management
        </h2>

        <p className="mt-1 text-xs font-medium leading-4 text-[#234B3A] sm:text-base sm:leading-normal">
          Track, qualify and convert potential customers into solar projects.
        </p>
      </div>
    </section>
  );
}

export default LeadManagementHero;