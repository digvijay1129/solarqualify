import { ChartNoAxesColumnIncreasing } from "lucide-react";
import heroImage from "../../../assets/images/solarqualify-hero-rooftop.jpg";

function ProjectTrackerHero() {
  return (
    <section
      className="relative isolate overflow-hidden rounded-2xl border border-brand-border bg-[#EAF9EF] px-5 py-5 shadow-sm sm:px-7"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(237,250,240,.98) 0%, rgba(237,250,240,.92) 48%, rgba(237,250,240,.14) 100%), url(${heroImage})`,
        backgroundPosition: "center, right 43%",
        backgroundSize: "cover, cover",
      }}
    >
      <div className="flex min-h-[76px] items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-mint-soft text-brand-forest sm:h-16 sm:w-16">
          <ChartNoAxesColumnIncreasing size={34} strokeWidth={2.3} aria-hidden="true" />
        </div>
        <div className="max-w-2xl min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight text-brand-text sm:text-2xl">
            Track &amp; Manage Solar Projects
          </h2>
          <p className="mt-1 text-sm font-medium leading-5 text-brand-text sm:text-base">
            Monitor installation progress, key milestones and subsidy status in one place.
          </p>
        </div>
      </div>
    </section>
  );
}

export default ProjectTrackerHero;
