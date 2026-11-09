import { Mail, Phone, UserRound } from "lucide-react";
import AuthField from "./AuthField.jsx";

function RegistrationStepBasic({ values, errors, onChange }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
      <AuthField
        id="fullName"
        label="Full Name"
        icon={UserRound}
        value={values.fullName}
        onChange={(value) => onChange("fullName", value)}
        placeholder="Enter your full name"
        autoComplete="name"
        error={errors.fullName}
      />
      <AuthField
        id="mobileNumber"
        label="Mobile Number"
        icon={Phone}
        prefix="+91"
        value={values.mobileNumber}
        onChange={(value) => onChange("mobileNumber", value.replace(/\D/g, "").slice(0, 10))}
        placeholder="Enter 10-digit mobile number"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        error={errors.mobileNumber}
      />
      <div className="sm:col-span-2">
        <AuthField
          id="email"
          label="Email Address"
          icon={Mail}
          value={values.email}
          onChange={(value) => onChange("email", value)}
          placeholder="Enter your email address"
          type="email"
          autoComplete="email"
          error={errors.email}
        />
      </div>
    </div>
  );
}

export default RegistrationStepBasic;
