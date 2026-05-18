"use client";

import FormWrapper from "./FormWrapper";
import { FormInput, FormSelect, FormTextarea } from "./FormField";

export default function LandlordForm() {
  return (
    <FormWrapper
      formType="landlord"
      title="Landlord Enquiry"
      description="Tell us about your property and we'll help you get the best return."
    >
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Full Name"  name="name"  placeholder="Jane Smith" required />
        <FormInput label="Phone"      name="phone" placeholder="+44 7700 900000" />
      </div>
      <FormInput label="Email" name="email" type="email" placeholder="jane@example.com" />
      <FormInput label="Company / Agency (optional)" name="company" placeholder="Smith Properties Ltd" />

      <FormSelect
        label="Property Type"
        name="property_type"
        options={[
          { value: "hmo",        label: "HMO" },
          { value: "single_let", label: "Single Let" },
          { value: "sa",         label: "Serviced Accommodation" },
          { value: "commercial", label: "Commercial" },
          { value: "mixed",      label: "Mixed Use" },
          { value: "other",      label: "Other" },
        ]}
      />

      <FormInput label="Number of Properties" name="property_count" type="number" placeholder="1" />
      <FormInput label="Location / Area"       name="location"      placeholder="Manchester, M1" />

      <FormSelect
        label="What service are you looking for?"
        name="service_needed"
        options={[
          { value: "full_management",   label: "Full Management" },
          { value: "let_only",          label: "Let Only" },
          { value: "rent_guarantee",    label: "Rent Guarantee" },
          { value: "refurb_management", label: "Refurb + Management" },
          { value: "other",             label: "Other" },
        ]}
        required
      />

      <FormTextarea
        label="Tell us more about your property / situation"
        name="message"
        placeholder="Any additional details, current issues, or specific requirements…"
        rows={4}
      />
    </FormWrapper>
  );
}
