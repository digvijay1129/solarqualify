import { CircleDollarSign, FileCheck2, House, Users } from "lucide-react";

const numberFormat = new Intl.NumberFormat("en-IN");
const currencyFormat = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function SummaryValue({ label, value, detail }) {
  return <div className="rounded-xl bg-slate-50 px-3 py-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-slate-950">{value}</p>{detail && <p className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</p>}</div>;
}

function DashboardAnalyticsSummary({ summary, reportingNotes = [] }) {
  const leads = summary?.leads ?? {};
  const quotations = summary?.quotations ?? {};
  const projects = summary?.projects ?? {};
  const financials = summary?.financials ?? {};
  const revenueTracked = financials.realizedRevenueStatus === "tracked" &&
    financials.realizedRevenue != null;

  return (
    <section className="space-y-4" aria-label="Live performance summary">
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="min-w-0 rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
          <div className="mb-3 flex items-center gap-2"><Users size={20} className="text-brand-emerald" /><h2 className="text-sm font-extrabold text-brand-text">Lead Outcomes</h2></div>
          <div className="grid grid-cols-2 gap-2">
            <SummaryValue label="Total Leads" value={numberFormat.format(leads.total ?? 0)} />
            <SummaryValue label="Qualified" value={numberFormat.format(leads.qualified ?? 0)} detail={`${Number(leads.qualificationRate ?? 0).toFixed(1)}% qualification rate`} />
            <SummaryValue label="Converted" value={numberFormat.format(leads.converted ?? 0)} detail={`${Number(leads.conversionRate ?? 0).toFixed(1)}% conversion rate`} />
            <SummaryValue label="High Priority" value={numberFormat.format(summary?.highPriority ?? 0)} detail="Follow-up indicator, not rejection" />
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
          <div className="mb-3 flex items-center gap-2"><FileCheck2 size={20} className="text-brand-emerald" /><h2 className="text-sm font-extrabold text-brand-text">Quotation Pipeline</h2></div>
          <div className="grid grid-cols-2 gap-2">
            <SummaryValue label="Generated" value={numberFormat.format(quotations.generated ?? 0)} />
            <SummaryValue label="Sent" value={numberFormat.format(quotations.sent ?? 0)} />
            <SummaryValue label="Accepted" value={numberFormat.format(quotations.accepted ?? 0)} />
            <SummaryValue label="Acceptance Rate" value={`${Number(quotations.acceptanceRate ?? 0).toFixed(1)}%`} detail="Accepted ÷ generated formal quotations" />
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
          <div className="mb-3 flex items-center gap-2"><House size={20} className="text-brand-emerald" /><h2 className="text-sm font-extrabold text-brand-text">Projects Created in Period</h2></div>
          <div className="grid grid-cols-2 gap-2">
            <SummaryValue label="Total Projects" value={numberFormat.format(projects.total ?? 0)} />
            <SummaryValue label="Active" value={numberFormat.format(projects.active ?? 0)} />
            <SummaryValue label="On Hold" value={numberFormat.format(projects.onHold ?? 0)} />
            <SummaryValue label="Completed" value={numberFormat.format(projects.completed ?? 0)} />
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
        <div className="mb-3 flex items-center gap-2"><CircleDollarSign size={20} className="text-brand-emerald" /><h2 className="text-sm font-extrabold text-brand-text">Quotation Value Estimates</h2></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryValue label="Generated Quotation Value" value={currencyFormat.format(financials.generatedQuotationValueEstimate ?? 0)} detail="Estimated net value of formal quotations" />
          <SummaryValue label="Accepted Quotation Value" value={currencyFormat.format(financials.acceptedQuotationValueEstimate ?? 0)} detail="Estimated value of accepted quotations" />
          <SummaryValue label="Realized Revenue" value={revenueTracked ? currencyFormat.format(financials.realizedRevenue) : "Not tracked"} detail={revenueTracked ? "Revenue reported by the backend" : "Payment and invoice transactions are not stored by this application"} />
        </div>
        <p className="mt-3 text-[10px] leading-5 text-brand-muted">{financials.explanation || "Quotation values are estimates, not cash receipts or recognized accounting revenue."}</p>
      </article>

      {reportingNotes.length > 0 && (
        <details className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <summary className="cursor-pointer text-xs font-bold text-slate-700">Analytics definitions and reporting caveats</summary>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[10px] leading-5 text-slate-600">
            {reportingNotes.map((note, index) => <li key={index}>{note}</li>)}
          </ul>
        </details>
      )}
    </section>
  );
}

export default DashboardAnalyticsSummary;
