import { useState } from "react";
import { Bell, CircleHelp, Headset, Mail, MessageSquare, Phone, Save, UserRound } from "lucide-react";
import { useHomeownerPortal } from "../context/HomeownerPortalContext.jsx";
import { validateSupportRequest } from "../utils/homeowner-portal.js";

function HomeownerProfileSupportPage() {
  const {
    profile, notificationPreferences, setNotificationPreferences,
    contactPreferences, setContactPreferences, supportTopics = [],
    supportRequests = [], addSupportRequest, projects = [], setNotice,
  } = useHomeownerPortal();
  const [request, setRequest] = useState({ subject: "", projectId: "", message: "" });
  const [requestErrors, setRequestErrors] = useState({});
  const initials = String(profile.fullName || "Homeowner").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  function submitSupport(event) {
    event.preventDefault();
    const errors = validateSupportRequest(request);
    setRequestErrors(errors);
    if (Object.keys(errors).length) return;
    addSupportRequest(request);
    setRequest({ subject: "", projectId: "", message: "" });
    setRequestErrors({});
    setNotice({ tone: "success", message: "Your message was added to this browser session only. It has not been sent to the support team." });
  }

  const notificationToggles = [
    ["projectUpdates", "Project Updates", "Installation progress and project milestones"],
    ["quotationUpdates", "Quotation & Pricing", "Quotation and pricing updates"],
    ["subsidyAlerts", "Subsidy & Policy Alerts", "Scheme guidance and policy information"],
    ["productUpdates", "Product & Service Updates", "Application and service announcements"],
  ];
  const contactToggles = [
    ["email", "Email", "Email contact preference"],
    ["phone", "Phone (Call)", "Phone contact preference"],
    ["whatsapp", "SMS / WhatsApp", "Messaging contact preference"],
  ];

  return (
    <div className="space-y-5">
      <header className="flex items-start gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800"><UserRound size={26} /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800">Account settings</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-[30px]">Profile & Support</h1><p className="mt-1 max-w-3xl text-sm text-slate-600">Review the account details verified by the SolarQualify API and manage temporary communication preferences.</p></div></header>

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 2xl:grid-cols-[.92fr_1.08fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2"><UserRound size={21} className="text-emerald-700" /><h2 className="text-base font-black text-slate-950">My Account</h2></div>
            <div className="mt-4 flex flex-wrap items-center gap-4"><span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-emerald-100 text-xl font-black text-emerald-900">{initials || "H"}</span><div className="min-w-0"><p className="text-lg font-black text-slate-950">{profile.fullName || "Homeowner"}</p><span className="mt-1 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-800">Authenticated Homeowner</span><p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Mail size={13} /> {profile.email || "Email not available"}</span><span className="inline-flex items-center gap-1"><Phone size={13} /> {profile.mobileNumber ? `+91 ${profile.mobileNumber}` : "Phone not available"}</span></p></div></div>
            <p className="mt-4 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-950">Name, email and phone are read from your authenticated account. Profile editing is not exposed by the current account API.</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2"><Phone size={20} className="text-emerald-700" /><h2 className="text-sm font-black text-slate-950">Contact Preferences</h2></div>
            <p className="mt-1 text-[10px] text-slate-500">Choose your preferred contact methods for this browser session.</p>
            <div className="mt-3 divide-y divide-slate-100">{contactToggles.map(([key, label, description]) => <label key={key} className="flex items-center justify-between gap-2 py-2.5"><span><span className="block text-xs font-extrabold text-slate-900">{label}</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{description}</span></span><input type="checkbox" checked={Boolean(contactPreferences[key])} onChange={(event) => setContactPreferences((current) => ({ ...current, [key]: event.target.checked }))} className="h-4 w-4 accent-emerald-700" /></label>)}</div>
            <p className="mt-2 text-[10px] text-slate-500">These preferences are temporary. They are not saved by the backend yet.</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2"><Bell size={20} className="text-emerald-700" /><h2 className="text-sm font-black text-slate-950">Notification Settings</h2></div>
            <div className="mt-3 divide-y divide-slate-100">{notificationToggles.map(([key, title, description]) => <label key={key} className="flex items-center justify-between gap-3 py-3"><span className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800"><Bell size={16} /></span><span><span className="block text-xs font-extrabold text-slate-900">{title}</span><span className="mt-0.5 block text-[10px] text-slate-500">{description}</span></span></span><input type="checkbox" checked={Boolean(notificationPreferences[key])} onChange={(event) => setNotificationPreferences((current) => ({ ...current, [key]: event.target.checked }))} className="h-4 w-4 accent-emerald-700" /></label>)}</div>
            <p className="mt-2 text-[10px] text-slate-500">Notification delivery is not configured in this homeowner profile flow.</p>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl bg-[#06454a] p-5 text-white shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15"><Headset size={25} /></span><div><h2 className="text-xl font-black">Need Help?</h2><p className="mt-1 max-w-md text-xs leading-5 text-emerald-50">Use the form below to prepare a support message. The current backend does not expose a support-ticket endpoint.</p></div></div><div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2"><div className="rounded-xl border border-white/20 bg-white/10 p-3"><p className="text-[10px] text-emerald-100">Support phone</p><p className="mt-1 text-sm font-extrabold">Not configured</p></div><div className="rounded-xl border border-white/20 bg-white/10 p-3"><p className="text-[10px] text-emerald-100">Support email</p><p className="mt-1 text-sm font-extrabold">Not configured</p></div></div></section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800"><MessageSquare size={19} /></span><div><h2 className="text-sm font-black text-slate-950">Message Support</h2><p className="text-[10px] text-slate-500">Compose a message for a later support integration.</p></div></div>
            <form onSubmit={submitSupport} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-extrabold text-slate-700">Subject *<select value={request.subject} onChange={(event) => setRequest((value) => ({ ...value, subject: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-normal"><option value="">Select a topic</option>{supportTopics.map((topic) => <option key={topic}>{topic}</option>)}</select>{requestErrors.subject && <span className="mt-1 block text-[10px] text-red-600">{requestErrors.subject}</span>}</label>
                <label className="block text-xs font-extrabold text-slate-700">Project (optional)<select value={request.projectId} onChange={(event) => setRequest((value) => ({ ...value, projectId: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-normal"><option value="">Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title} · {project.id}</option>)}</select></label>
              </div>
              <label className="block text-xs font-extrabold text-slate-700">Message *<textarea value={request.message} onChange={(event) => setRequest((value) => ({ ...value, message: event.target.value }))} rows={4} maxLength={500} placeholder="Describe your question or issue in detail..." className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-xs font-normal outline-none focus:border-emerald-600" />{requestErrors.message && <span className="mt-1 block text-[10px] text-red-600">{requestErrors.message}</span>}</label>
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] text-slate-500">{request.message.length}/500</span><div className="flex items-center gap-2"><button type="button" onClick={() => { setRequest({ subject: "", projectId: "", message: "" }); setRequestErrors({}); }} className="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700">Clear</button><button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-amber-300"><Save size={15} /> Save Draft</button></div></div>
            </form>
            {supportRequests.length > 0 && <div className="mt-4 border-t border-slate-100 pt-3"><p className="text-xs font-bold text-slate-800">Session drafts ({supportRequests.length})</p><ul className="mt-2 space-y-2">{supportRequests.map((item) => <li key={item.id} className="rounded-lg bg-slate-50 p-3 text-xs"><p className="font-bold text-slate-900">{item.subject} · {item.id}</p><p className="mt-1 text-slate-600">{item.message}</p><p className="mt-1 text-[10px] text-amber-800">Saved in this browser session only · Not sent</p></li>)}</ul></div>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center gap-2"><CircleHelp size={19} className="text-emerald-700" /><h2 className="text-sm font-black text-slate-950">Help & FAQs</h2></div><p className="mt-2 text-xs leading-5 text-slate-600">For scheme eligibility, utility requirements or system recommendations, confirm details with your authorised installer and the relevant official provider. This account currently has no live FAQ/support API feed.</p></section>
        </div>
      </div>
    </div>
  );
}

export default HomeownerProfileSupportPage;
