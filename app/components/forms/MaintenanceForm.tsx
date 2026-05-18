"use client";

import FormWrapper from "./FormWrapper";
import { FormInput, FormSelect, FormTextarea } from "./FormField";

export default function MaintenanceForm() {
  return (
    <FormWrapper
      formType="maintenance"
      title="Maintenance Enquiry"
      description="Tell us about your maintenance needs and we'll get back to you quickly."
    >
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Full Name" name="name"  placeholder="Sarah Jones" required />
        <FormInput label="Phone"     name="phone" placeholder="+44 7700 900000" required />
      </div>
      <FormInput label="Email" name="email" type="email" placeholder="sarah@example.com" />
      <FormInput label="Property Address" name="property_address" placeholder="12 High Street, Manchester, M1 1AA" required />

      <FormSelect
        label="Issue Type"
        name="issue_type"
        options={[
          { value: "plumbing",     label: "Plumbing / Leak" },
          { value: "electrical",   label: "Electrical" },
          { value: "roofing",      label: "Roofing" },
          { value: "windows_doors",label: "Windows / Doors" },
          { value: "damp_mould",   label: "Damp / Mould" },
          { value: "heating",      label: "Heating / Boiler" },
          { value: "kitchen",      label: "Kitchen / Appliances" },
          { value: "bathroom",     label: "Bathroom" },
          { value: "general",      label: "General Maintenance" },
          { value: "refurb",       label: "Full Refurbishment" },
          { value: "other",        label: "Other" },
        ]}
        required
      />

      <FormSelect
        label="Urgency"
        name="urgency"
        options={[
          { value: "emergency",   label: "Emergency — needs attention today" },
          { value: "urgent",      label: "Urgent — within 48 hours" },
          { value: "soon",        label: "Soon — within 1 week" },
          { value: "flexible",    label: "Flexible — within 2–4 weeks" },
          { value: "planned",     label: "Planned — scheduled work" },
        ]}
        required
      />

      <FormSelect
        label="Property Owner / Tenant?"
        name="occupier_type"
        options={[
          { value: "owner",        label: "Property Owner" },
          { value: "tenant",       label: "Tenant" },
          { value: "letting_agent",label: "Letting Agent" },
        ]}
      />

      <FormTextarea
        label="Describe the issue"
        name="message"
        placeholder="Please describe the problem in as much detail as possible. Include how long the issue has been present and any relevant history."
        rows={5}
        required
      />
    </FormWrapper>
  );
}
