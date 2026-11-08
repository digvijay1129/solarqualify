# Phase 3.8 assumptions and boundaries

These assumptions are implementation choices where the supplied images do not show every field or state.

## Login

- Homeowner is selected by default to match the supplied login reference.
- Sales Staff can select the Sales Staff role, but staff registration is not offered. Staff accounts are assumed to be provisioned by an administrator.
- Email and password are required to pass frontend validation.
- Remember me is a UI preference only in this phase; it does not persist a token or credentials.
- Google sign-in is displayed to match the reference but reports that OAuth is not connected.

## Homeowner registration

The reference explicitly shows Basic Details, then names the remaining steps Address, Property & Solar, and Create Account. The exact later-step field list is not visible, so the following are proposed form fields based on the project brief.

### Step 1 — Basic Details
- Full name: required.
- Mobile number: required, exactly 10 digits (country prefix is shown separately as +91).
- Email address: required and validated.
- Date of birth: optional because the reference does not mark it as required.

### Step 2 — Address
- House / flat number, address line 1, city, state and 6-digit pincode: required.
- Address line 2: optional.
- State/UT options are a fixed UI list, not an externally verified postal database.

### Step 3 — Property & Solar
- Ownership status (Owner / Tenant): required.
- Roof type (RCC / Metal / Tile / Other): required.
- Approximate usable roof area in square feet: required and greater than zero.
- Average monthly electricity bill in INR: required and zero or greater.
- These fields align with the project brief's homeowner lead qualification inputs. This step does not yet upload an electricity bill; bill upload and OCR remain separate application workflows.

### Step 4 — Create Account
- Password: minimum 8 characters for this prototype.
- Confirm password must match.
- Terms/privacy acknowledgement is required to pass the local form validation.
- Passwords are never saved or logged by this frontend package.

## Demo-only behaviour

- Submit Sign In validates the form and then displays a message that backend authentication is not connected.
- Create Account validates all steps and then displays a message that no account was created or persisted.
- Forgot Password validates the email and explains that the reset service is not connected.
- No OAuth request, API call, local/session storage, cookie, or database write is performed.
- A real implementation must use backend authentication, secure cookies/session handling, server-side password hashing, authorization checks, and audit logging where appropriate.
