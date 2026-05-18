import type { ReactNode } from "react";

export const metadata = {
  title: "Braxton OS — Enquiry Form",
  description: "Submit your enquiry to Braxton OS.",
};

export default function FormsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Branded header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            B
          </div>
          <span className="text-white font-semibold text-lg">Braxton OS</span>
        </div>
      </header>

      {/* Form content */}
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-4 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Braxton OS. Your data is handled securely.
      </footer>
    </div>
  );
}
