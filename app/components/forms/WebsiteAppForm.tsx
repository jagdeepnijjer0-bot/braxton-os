"use client";

import FormWrapper from "./FormWrapper";
import { FormInput, FormSelect, FormTextarea } from "./FormField";

export default function WebsiteAppForm() {
  return (
    <FormWrapper
      formType="website_app"
      title="Website & App Enquiry"
      description="Tell us about your project and we'll help bring it to life."
    >
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Full Name" name="name"  placeholder="Alex Brown" required />
        <FormInput label="Phone"     name="phone" placeholder="+44 7700 900000" />
      </div>
      <FormInput label="Email"   name="email"   type="email" placeholder="alex@startup.com" required />
      <FormInput label="Company" name="company" placeholder="My Startup Ltd" />

      <FormSelect
        label="Project Type"
        name="project_type"
        options={[
          { value: "new_website",     label: "New Website" },
          { value: "redesign",        label: "Website Redesign" },
          { value: "web_app",         label: "Web Application" },
          { value: "mobile_app",      label: "Mobile App" },
          { value: "landing_page",    label: "Landing Page" },
          { value: "ecommerce",       label: "E-commerce Store" },
          { value: "crm_portal",      label: "CRM / Client Portal" },
          { value: "other",           label: "Other" },
        ]}
        required
      />

      <FormSelect
        label="Budget Range"
        name="budget"
        options={[
          { value: "under_1k",     label: "Under £1,000" },
          { value: "1k_5k",        label: "£1,000 – £5,000" },
          { value: "5k_15k",       label: "£5,000 – £15,000" },
          { value: "15k_plus",     label: "£15,000+" },
          { value: "not_sure",     label: "Not Sure Yet" },
        ]}
      />

      <FormSelect
        label="Timeline"
        name="timeline"
        options={[
          { value: "asap",        label: "As soon as possible" },
          { value: "1_month",     label: "Within 1 month" },
          { value: "3_months",    label: "Within 3 months" },
          { value: "flexible",    label: "Flexible" },
        ]}
      />

      <FormInput label="Current Website (if any)" name="current_website" placeholder="https://example.com" />

      <FormTextarea
        label="Describe your project"
        name="message"
        placeholder="What do you need built? Who is it for? What problem does it solve? Any specific features or integrations in mind?"
        rows={5}
        required
      />
    </FormWrapper>
  );
}
