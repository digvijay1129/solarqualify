function AuthField({
  id,
  label,
  compact = false,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
  error,
  optional = false,
  autoComplete,
  inputMode,
  prefix,
  rightSlot,
  min,
  max,
  step,
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={`flex flex-wrap items-center gap-1 text-sm font-bold text-brand-text ${compact ? "mb-1 lg:mb-1" : "mb-1.5"}`}>
        <span>{label}</span>
        {optional && <span className="font-normal text-brand-muted">(optional)</span>}
        {!optional && <span className="text-red-600" aria-hidden="true">*</span>}
      </label>
      <div className={[
        "flex min-h-[52px] min-w-0 items-center gap-3 rounded-xl border bg-white px-3 transition focus-within:ring-2 sm:min-h-[55px] sm:px-4",
        compact ? "lg:min-h-[48px] lg:rounded-[10px]" : "",
        error ? "border-red-400 focus-within:ring-red-100" : "border-slate-300 focus-within:border-brand-emerald focus-within:ring-brand-emerald/15",
      ].join(" ")}>
        {Icon && <Icon size={19} className="shrink-0 text-brand-text" aria-hidden="true" />}
        {prefix && <span className="shrink-0 border-r border-slate-200 pr-2 text-sm font-semibold text-brand-text">{prefix}</span>}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          min={min}
          max={max}
          step={step}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full min-w-0 bg-transparent py-3.5 text-sm text-brand-text sm:text-base outline-none placeholder:text-slate-400 ${compact ? "lg:py-2.5" : ""}`}
        />
        {rightSlot}
      </div>
      {error && <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export default AuthField;
