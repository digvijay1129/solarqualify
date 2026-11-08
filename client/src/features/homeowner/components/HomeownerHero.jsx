import rooftopImage from "../../../assets/images/solarqualify-homeowner-rooftop.jpg";
import foliageImage from "../../../assets/images/solarqualify-homeowner-foliage.png";

function HomeownerHero({ eyebrow, title, description, compact = false, children, greeting = false }) {
  const height = compact ? "min-h-[150px] sm:min-h-[164px]" : "min-h-[184px] sm:min-h-[205px]";
  return (
    <section
      className={`relative isolate overflow-hidden rounded-2xl border border-emerald-100 bg-[#eaf7f0] shadow-sm ${height}`}
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(235,250,241,.98) 0%, rgba(255,255,255,.90) 43%, rgba(255,255,255,.12) 100%), url(${rooftopImage}), url(${foliageImage})`,
        backgroundSize: "cover, cover, 290px auto",
        backgroundPosition: "center, right 52%, right top",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className={`relative z-10 flex ${height} max-w-[780px] flex-col justify-center p-5 sm:p-7 lg:p-8`}>
        {eyebrow && <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-800">{eyebrow}</p>}
        <h1 className={`${greeting ? "text-2xl sm:text-3xl" : "text-2xl sm:text-[30px]"} max-w-3xl font-black leading-tight tracking-tight text-slate-950`}>{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </section>
  );
}

export default HomeownerHero;
