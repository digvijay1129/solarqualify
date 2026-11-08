import { useState } from "react";
import {
  Bell, Check, ChevronDown, CircleHelp, Headset, House, Mail,
  MessageSquare, Phone, Save, UserRound, Pencil,
} from "lucide-react";
import { useHomeownerPortal } from "../context/HomeownerPortalContext.jsx";
import { validateProfile, validateSupportRequest } from "../utils/homeowner-portal.js";
import rooftopImage from "../../../assets/images/solarqualify-homeowner-rooftop.jpg";

function HomeownerProfileSupportPage() {
  const {
    profile, setProfile, notificationPreferences, setNotificationPreferences,
    contactPreferences, setContactPreferences, faqs, supportTopics,
    supportRequests, addSupportRequest, setNotice,
  } = useHomeownerPortal();
  const [editing, setEditing] = useState(false);
  const [profileDraft, setProfileDraft] = useState(profile);
  const [profileErrors, setProfileErrors] = useState({});
  const [expandedFaq, setExpandedFaq] = useState("faq-1");
  const [request, setRequest] = useState({ subject: "", projectId: "", message: "" });
  const [requestErrors, setRequestErrors] = useState({});
  const initials = profile.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  function saveProfile(event) {
    event.preventDefault();
    const errors = validateProfile(profileDraft);
    setProfileErrors(errors);
    if (Object.keys(errors).length) return;
    setProfile(profileDraft);
    setEditing(false);
    setNotice({ tone: "success", message: "Profile changes are saved in this page session only; no account service was updated." });
  }

  function submitSupport(event) {
    event.preventDefault();
    const errors = validateSupportRequest(request);
    setRequestErrors(errors);
    if (Object.keys(errors).length) return;
    addSupportRequest(request);
    setRequest({ subject: "", projectId: "", message: "" });
    setRequestErrors({});
    setNotice({ tone: "success", message: "Your support message was added to this browser session only. It was not sent to the SolarQualify team." });
  }

  const notificationToggles = [
    ["projectUpdates", "Project Updates", "Installation progress, site visits and next steps"],
    ["quotationUpdates", "Quotation & Pricing", "New quotations, revisions and pricing updates"],
    ["subsidyAlerts", "Subsidy & Policy Alerts", "Scheme guidance and policy-related updates"],
    ["productUpdates", "Product & Service Updates", "New features and service announcements"],
  ];
  const contactToggles = [["email", "Email", "Project updates, quotations and documents"], ["phone", "Phone (Call)", "Important updates and scheduling"], ["whatsapp", "SMS / WhatsApp", "Quick alerts and reminders"]];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800"><UserRound size={26} /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800">Account settings</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-[30px]">Profile & Support</h1><p className="mt-1 max-w-3xl text-sm text-slate-600">Update your profile, manage your preferences and get help from the SolarQualify team.</p></div></div>

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 2xl:grid-cols-[.92fr_1.08fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><UserRound size={21} className="text-emerald-700" /><h2 className="text-base font-black text-slate-950">My Profile</h2></div><button type="button" onClick={() => { setEditing((value) => !value); setProfileDraft(profile); setProfileErrors({}); }} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-emerald-700 px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-50"><Pencil size={14} /> {editing ? "Cancel" : "Edit Profile"}</button></div>
            {!editing ? (
              <div className="mt-4 flex flex-wrap items-center gap-4"><span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-emerald-100 text-xl font-black text-emerald-900">{initials}</span><div className="min-w-0"><p className="text-lg font-black text-slate-950">{profile.fullName}</p><span className="mt-1 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-800">Homeowner · Demo</span><p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Mail size={13} /> {profile.email}</span><span className="inline-flex items-center gap-1"><Phone size={13} /> +91 {profile.mobileNumber}</span></p></div></div>
            ) : (
              <form onSubmit={saveProfile} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700">Full Name<input value={profileDraft.fullName} onChange={(event) => setProfileDraft((value) => ({ ...value, fullName: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" />{profileErrors.fullName && <span className="text-red-600">{profileErrors.fullName}</span>}</label>
                <label className="text-xs font-bold text-slate-700">Mobile Number<input value={profileDraft.mobileNumber} onChange={(event) => setProfileDraft((value) => ({ ...value, mobileNumber: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" />{profileErrors.mobileNumber && <span className="text-red-600">{profileErrors.mobileNumber}</span>}</label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Email Address<input value={profileDraft.email} onChange={(event) => setProfileDraft((value) => ({ ...value, email: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" />{profileErrors.email && <span className="text-red-600">{profileErrors.email}</span>}</label>
                <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white sm:col-span-2"><Save size={15} /> Save Profile in Demo</button>
              </form>
            )}
          </section>

          <section className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2"><House size={20} className="text-emerald-700" /><h2 className="text-sm font-black text-slate-950">Property Details</h2></div>
              <dl className="mt-3 space-y-2.5 text-xs">{[["Property Type", profile.propertyType], ["Location", `${profile.city}, ${profile.state}`], ["Built-up / Roof Area", `${profile.roofAreaSqFt || "—"} sq. ft.`], ["Roof Type", profile.roofType], ["Ownership", profile.ownershipStatus], ["PIN Code", profile.pincode]].map(([label, value]) => <div key={label} className="flex justify-between gap-2 border-b border-slate-100 pb-2"><dt className="text-slate-500">{label}</dt><dd className="text-right font-bold text-slate-900">{value || "Not provided"}</dd></div>)}</dl>
              <p className="mt-3 text-[10px] leading-4 text-slate-500">Property information is illustrative and editable only after profile service integration.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2"><Phone size={20} className="text-emerald-700" /><h2 className="text-sm font-black text-slate-950">Contact Preferences</h2></div>
              <p className="mt-1 text-[10px] text-slate-500">Choose how you would like to be contacted.</p>
              <div className="mt-3 divide-y divide-slate-100">{contactToggles.map(([key, label, description]) => <label key={key} className="flex items-center justify-between gap-2 py-2.5"><span><span className="block text-xs font-extrabold text-slate-900">{label}</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{description}</span></span><input type="checkbox" checked={Boolean(contactPreferences[key])} onChange={(event) => setContactPreferences((current) => ({ ...current, [key]: event.target.checked }))} className="h-4 w-4 accent-emerald-700" /></label>)}</div>
              <p className="mt-2 text-[10px] text-slate-500">Preferences remain in this page session only.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2"><Bell size={20} className="text-emerald-700" /><h2 className="text-sm font-black text-slate-950">Notification Settings</h2></div>
            <p className="mt-1 text-xs text-slate-500">Choose which updates you want to receive.</p>
            <div className="mt-3 divide-y divide-slate-100">{notificationToggles.map(([key, title, description]) => <label key={key} className="flex items-center justify-between gap-3 py-3"><span className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800"><Bell size={16} /></span><span><span className="block text-xs font-extrabold text-slate-900">{title}</span><span className="mt-0.5 block text-[10px] text-slate-500">{description}</span></span></span><input type="checkbox" checked={Boolean(notificationPreferences[key])} onChange={(event) => setNotificationPreferences((current) => ({ ...current, [key]: event.target.checked }))} className="h-4 w-4 accent-emerald-700" /></label>)}</div>
            <p className="mt-2 text-[10px] text-slate-500">Preferences are temporary page-session state. No notifications are sent.</p>
          </section>
        </div>

        <div className="space-y-4">
          <section className="relative isolate overflow-hidden rounded-2xl bg-[#06454a] p-5 text-white shadow-sm sm:p-6">
            <div className="absolute inset-0 -z-10 opacity-35" style={{ backgroundImage: `linear-gradient(90deg, #06454a 0%, rgba(6,69,74,.35) 100%), url(${rooftopImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15"><Headset size={25} /></span><div><h2 className="text-xl font-black">Need Help?</h2><p className="mt-1 max-w-md text-xs leading-5 text-emerald-50">Our support team can help you with your project, quotation, subsidy or any other query. Support contact services are not connected in this demo.</p></div></div></div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2"><div className="rounded-xl border border-white/20 bg-white/10 p-3"><p className="text-[10px] text-emerald-100">Support phone</p><p className="mt-1 text-sm font-extrabold">Not connected</p></div><div className="rounded-xl border border-white/20 bg-white/10 p-3"><p className="text-[10px] text-emerald-100">Support email</p><p className="mt-1 text-sm font-extrabold">Not connected</p></div></div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800"><CircleHelp size={20} /></span><div><h2 className="text-sm font-black text-slate-950">Help & FAQs</h2><p className="text-[10px] text-slate-500">Find quick answers to common questions.</p></div></div><span className="text-xs font-bold text-emerald-800">Help Centre</span></div>
            <div className="mt-3 space-y-2">{faqs.map((faq) => <div key={faq.id} className="overflow-hidden rounded-lg border border-slate-200"><button type="button" aria-expanded={expandedFaq === faq.id} onClick={() => setExpandedFaq((current) => current === faq.id ? null : faq.id)} className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-xs font-extrabold text-slate-900 hover:bg-slate-50"><span className="flex min-w-0 items-center gap-2"><CircleHelp size={15} className="shrink-0 text-emerald-700" />{faq.question}</span><ChevronDown size={16} className={`shrink-0 transition ${expandedFaq === faq.id ? "rotate-180" : ""}`} /></button>{expandedFaq === faq.id && <p className="border-t border-slate-100 px-3 py-3 text-xs leading-5 text-slate-600">{faq.answer}</p>}</div>)}</div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800"><MessageSquare size={19} /></span><div><h2 className="text-sm font-black text-slate-950">Message Support</h2><p className="text-[10px] text-slate-500">Send us a message and we’ll get back to you soon.</p></div></div>
            <form onSubmit={submitSupport} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-extrabold text-slate-700">Subject *<select value={request.subject} onChange={(event) => setRequest((value) => ({ ...value, subject: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-normal"><option value="">Select a topic</option>{supportTopics.map((topic) => <option key={topic}>{topic}</option>)}</select>{requestErrors.subject && <span className="mt-1 block text-[10px] text-red-600">{requestErrors.subject}</span>}</label>
                <label className="block text-xs font-extrabold text-slate-700">Project (optional)<select value={request.projectId} onChange={(event) => setRequest((value) => ({ ...value, projectId: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-normal"><option value="">Select your project</option><option value="DEMO-PROJECT-0147">Residential Rooftop Solar Installation (Demo)</option></select></label>
              </div>
              <label className="block text-xs font-extrabold text-slate-700">Message *<textarea value={request.message} onChange={(event) => setRequest((value) => ({ ...value, message: event.target.value }))} rows={4} maxLength={500} placeholder="Describe your question or issue in detail..." className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-xs font-normal outline-none focus:border-emerald-600" />{requestErrors.message && <span className="mt-1 block text-[10px] text-red-600">{requestErrors.message}</span>}</label>
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] text-slate-500">{request.message.length}/500</span><div className="flex items-center gap-2"><button type="button" onClick={() => { setRequest({ subject: "", projectId: "", message: "" }); setRequestErrors({}); }} className="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700">Clear</button><button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-amber-300"><Check size={15} /> Send Message (Demo)</button></div></div>
            </form>
            {supportRequests.length > 0 && <div className="mt-4 border-t border-slate-100 pt-3"><p className="text-xs font-bold text-slate-800">Your session messages ({supportRequests.length})</p><ul className="mt-2 space-y-2">{supportRequests.map((item) => <li key={item.id} className="rounded-lg bg-slate-50 p-3 text-xs"><p className="font-bold text-slate-900">{item.subject} · {item.id}</p><p className="mt-1 text-slate-600">{item.message}</p><p className="mt-1 text-[10px] text-amber-800">Not sent to support</p></li>)}</ul></div>}
          </section>
        </div>
      </div>
    </div>
  );
}

export default HomeownerProfileSupportPage;
