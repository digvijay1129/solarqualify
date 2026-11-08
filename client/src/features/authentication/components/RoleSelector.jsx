import { Home, Users } from "lucide-react";

const icons = {
  homeowner: Home,
  "sales-staff": Users,
};

function RoleSelector({ roles, value, onChange }) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Choose your account type</legend>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 sm:gap-4">
        {roles.map((role) => {
          const Icon = icons[role.id] ?? Users;
          const selected = value === role.id;

          return (
            <button
              key={role.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(role.id)}
              className={[
                "relative flex min-h-[118px] min-w-0 items-start gap-3 rounded-[20px] border p-4 text-left transition sm:min-h-[132px] sm:gap-4 sm:p-5 lg:min-h-[108px] lg:rounded-[18px] lg:p-4",
                selected
                  ? "border-brand-emerald bg-brand-mint-soft shadow-[0_0_0_1px_rgba(0,117,69,0.12)]"
                  : "border-slate-200 bg-white hover:border-brand-emerald/50 hover:bg-slate-50",
              ].join(" ")}
            >
              <Icon size={36} className={`mt-1 shrink-0 ${selected ? "text-brand-forest" : "text-brand-text"}`} />
              <span className="min-w-0 pr-4">
                <span className="block text-base font-extrabold text-brand-text sm:text-lg">{role.title}</span>
                <span className="mt-1.5 block text-xs leading-5 text-brand-text sm:text-sm sm:leading-6">{role.description}</span>
              </span>
              <span className={`absolute right-3 top-3 h-5 w-5 rounded-full border-2 ${selected ? "border-brand-emerald bg-brand-emerald shadow-[inset_0_0_0_3px_white]" : "border-slate-300 bg-white"}`} />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default RoleSelector;
