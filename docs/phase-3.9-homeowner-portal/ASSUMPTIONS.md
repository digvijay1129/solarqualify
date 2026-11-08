# Phase 3.9 — Assumptions and Limitations

- Every homeowner, project, activity, quotation and document record is illustrative demo data, not a real customer account.
- No backend API, MongoDB collection, identity provider or authentication guard is connected by this frontend phase.
- The login handoff must later use the server-verified role. Browser role choices are not authorization.
- The five-step inquiry collects contact data, address, property/roof data, usage and a recent electricity bill. It keeps values in component state only.
- Electricity bill validation checks extension, non-empty size and a 10 MB maximum. Image quality detection, OCR and extraction confirmation require the backend/OCR phase.
- The documents area adds local metadata only. It does not upload file bytes to S3 or another service. Fixture document entries are metadata-only and do not have downloadable file contents.
- Quotation prices are not invented. Equipment cost, installation charges, total cost and net cost remain pending until an approved price version is available.
- Annual generation uses the supplied 1,400 units per kW per year assumption. It is not a system performance guarantee.
- The displayed 3 kW subsidy example of ₹78,000 derives from the original brief's demo slabs. Its current official MNRE/DISCOM status and a homeowner's eligibility are not verified here.
- Quote acceptance and change requests are session-only. They do not create contracts, payments or installer work orders.
- Project milestones and dates are illustrative. No live installer, DISCOM, net-metering or subsidy status is connected.
- Profile changes, preference toggles and support messages remain in browser memory only. No notification, email, phone or WhatsApp communication is triggered.
- Existing asset dependency: `client/src/assets/images/solarqualify-hero-rooftop.jpg` from Phase 3.2.
