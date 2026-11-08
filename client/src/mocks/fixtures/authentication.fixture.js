export const authenticationFixture = {
  roles: [
    {
      id: "homeowner",
      title: "Homeowner",
      description: "Get a quotation, track your installation and subsidy",
    },
    {
      id: "sales-staff",
      title: "Sales Staff",
      description: "Create quotations, manage projects and customers",
    },
  ],
  loginBenefits: [
    { id: "quotation", title: "Instant Quotation", description: "Explore a solar quotation", icon: "calculator" },
    { id: "tracking", title: "Project Tracking", description: "Follow installation progress", icon: "layers" },
    { id: "subsidy", title: "Subsidy Management", description: "Understand subsidy status", icon: "subsidy" },
  ],
  registrationBenefits: [
    { id: "quotation", title: "Get Solar Quotations", description: "Receive a quotation for your property", icon: "quotation" },
    { id: "tracking", title: "Track Your Project", description: "Follow installation progress", icon: "tracking" },
    { id: "subsidy", title: "Apply for Subsidy", description: "Follow subsidy application status", icon: "subsidy" },
  ],
  registrationSteps: [
    { id: 1, label: "Basic Details", title: "Basic Details", description: "Let's start with your basic information." },
    { id: 2, label: "Address", title: "Address Details", description: "Where is the rooftop solar system planned?" },
    { id: 3, label: "Property & Solar", title: "Property & Solar Details", description: "Tell us about the property and electricity usage." },
    { id: 4, label: "Create Account", title: "Create Your Account", description: "Set a password to finish the demo registration." },
  ],
  statesAndUnionTerritories: [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
  ],
  roofTypes: [
    { value: "RCC", label: "RCC / Concrete" },
    { value: "Metal", label: "Metal Sheet" },
    { value: "Tile", label: "Tile Roof" },
    { value: "Other", label: "Other / Not Sure" },
  ],
  ownershipOptions: [
    { value: "owner", label: "I own this property" },
    { value: "tenant", label: "I am a tenant" },
  ],
};
