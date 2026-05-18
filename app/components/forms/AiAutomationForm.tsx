"use client";

import FormWrapper from "./FormWrapper";
import { FormInput, FormSelect, FormTextarea } from "./FormField";

export default function AiAutomationForm() {
  return (
    <FormWrapper
      formType="ai_automation"
      title="AI Automation Enquiry"
      description="Tell us about your business and we'll identify the best automation opportunities."
    >
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Full Name" name="name"  placeholder="Tom Wilson" required />
        <FormInput label="Phone"     name="phone" placeholder="+44 7700 900000" />
      </div>
      <FormInput label="Email"   name="email"   type="email" placeholder="tom@company.com" required />
      <FormInput label="Company" name="company" placeholder="Wilson Group Ltd" />

      <FormSelect
        label="Industry / Sector"
        name="industry"
        options={[
          { value: "property",     label: "Property / Real Estate" },
          { value: "finance",      label: "Finance / Accounting" },
          { value: "legal",        label: "Legal" },
          { value: "healthcare",   label: "Healthcare" },
          { value: "ecommerce",    label: "E-commerce / Retail" },
          { value: "hospitality",  label: "Hospitality / Accommodation" },
          { value: "construction", label: "Construction / Trades" },
          { value: "marketing",    label: "Marketing / Agency" },
          { value: "other",        label: "Other" },
        ]}
      />

      <FormSelect
        label="Primary Automation Goal"
        name="automation_goal"
        options={[
          { value: "lead_gen",       label: "Lead Generation & Follow-up" },
          { value: "data_entry",     label: "Data Entry / Admin Reduction" },
          { value: "customer_comms", label: "Customer Communications" },
          { value: "reporting",      label: "Reporting & Analytics" },
          { value: "ai_chatbot",     label: "AI Chatbot / Assistant" },
          { value: "workflow",       label: "Workflow / Process Automation" },
          { value: "crm",            label: "CRM Integration" },
          { value: "not_sure",       label: "Not Sure — Need Advice" },
        ]}
        required
      />

      <FormSelect
        label="Current Tools (pick closest)"
        name="current_tools"
        options={[
          { value: "none",        label: "None / Manual processes" },
          { value: "spreadsheets",label: "Spreadsheets" },
          { value: "zapier_make", label: "Zapier / Make" },
          { value: "crm",         label: "CRM (HubSpot, Salesforce, etc.)" },
          { value: "custom",      label: "Custom / In-house systems" },
          { value: "mixed",       label: "Mix of tools" },
        ]}
      />

      <FormSelect
        label="Monthly Budget for Automation"
        name="budget"
        options={[
          { value: "under_500",    label: "Under £500/month" },
          { value: "500_1500",     label: "£500 – £1,500/month" },
          { value: "1500_5000",    label: "£1,500 – £5,000/month" },
          { value: "5000_plus",    label: "£5,000+/month" },
          { value: "project_based",label: "Prefer project-based pricing" },
          { value: "not_sure",     label: "Not Sure" },
        ]}
      />

      <FormTextarea
        label="Describe your biggest operational challenge"
        name="message"
        placeholder="What manual tasks are taking the most time? What would you automate first if you could? Any current integrations or systems we should know about?"
        rows={5}
        required
      />
    </FormWrapper>
  );
}
