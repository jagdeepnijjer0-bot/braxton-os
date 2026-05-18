"use client";

import FormWrapper from "./FormWrapper";
import { FormInput, FormSelect, FormTextarea } from "./FormField";

export default function InvestorForm() {
  return (
    <FormWrapper
      formType="investor"
      title="Investor Criteria"
      description="Share your investment criteria and we'll match you with the right deals."
    >
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Full Name" name="name"  placeholder="John Investor" required />
        <FormInput label="Phone"     name="phone" placeholder="+44 7700 900000" />
      </div>
      <FormInput label="Email" name="email" type="email" placeholder="john@funds.com" required />
      <FormInput label="Company (optional)" name="company" placeholder="JI Capital Ltd" />

      <FormSelect
        label="Investment Strategy"
        name="strategy"
        options={[
          { value: "btl",         label: "Buy to Let" },
          { value: "hmo",         label: "HMO" },
          { value: "sa",          label: "Serviced Accommodation" },
          { value: "flip",        label: "Flip / Refurb & Sell" },
          { value: "commercial",  label: "Commercial Conversion" },
          { value: "land",        label: "Land / Development" },
          { value: "mixed",       label: "Mixed Portfolio" },
        ]}
        required
      />

      <FormSelect
        label="Budget Range"
        name="budget"
        options={[
          { value: "under_50k",    label: "Under £50k" },
          { value: "50k_100k",     label: "£50k – £100k" },
          { value: "100k_250k",    label: "£100k – £250k" },
          { value: "250k_500k",    label: "£250k – £500k" },
          { value: "500k_plus",    label: "£500k+" },
        ]}
        required
      />

      <FormSelect
        label="Target ROI"
        name="target_roi"
        options={[
          { value: "8_to_10",  label: "8–10%" },
          { value: "10_to_15", label: "10–15%" },
          { value: "15_plus",  label: "15%+" },
          { value: "flexible", label: "Flexible / Deal Dependent" },
        ]}
      />

      <FormInput label="Preferred Location(s)" name="preferred_locations" placeholder="e.g. Manchester, Leeds, Birmingham" />

      <FormSelect
        label="Finance Method"
        name="finance_method"
        options={[
          { value: "cash",           label: "Cash Buyer" },
          { value: "mortgage",       label: "Mortgage / BTL" },
          { value: "bridging",       label: "Bridging Finance" },
          { value: "jv",             label: "Joint Venture" },
          { value: "not_sure",       label: "Not Sure Yet" },
        ]}
      />

      <FormTextarea
        label="Additional criteria or goals"
        name="message"
        placeholder="Tell us more about what you're looking for, your timeline, or any specific requirements…"
        rows={4}
      />
    </FormWrapper>
  );
}
