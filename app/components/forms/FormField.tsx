"use client";

interface InputProps {
  label:        string;
  name:         string;
  type?:        string;
  placeholder?: string;
  required?:    boolean;
  hint?:        string;
}

export function FormInput({ label, name, type = "text", placeholder, required, hint }: InputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
      />
      {hint && <p className="text-gray-500 text-xs mt-1">{hint}</p>}
    </div>
  );
}

interface TextareaProps {
  label:        string;
  name:         string;
  placeholder?: string;
  required?:    boolean;
  rows?:        number;
}

export function FormTextarea({ label, name, placeholder, required, rows = 4 }: TextareaProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <textarea
        name={name}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors resize-none"
      />
    </div>
  );
}

interface SelectProps {
  label:    string;
  name:     string;
  options:  { value: string; label: string }[];
  required?: boolean;
}

export function FormSelect({ label, name, options, required }: SelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors appearance-none"
      >
        <option value="" disabled>Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
