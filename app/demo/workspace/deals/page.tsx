"use client";

import { useState, useRef, useEffect } from "react";
import { DEMO_PROJECTS } from "@/lib/demo/seed";

const TYPE_BADGE: Record<string, string> = {
  deal:    "bg-indigo-50 text-indigo-700 border border-indigo-200",
  project: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

const STATUS_BADGE: Record<string, string> = {
  active:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  at_risk:  "bg-red-50 text-red-600 border border-red-200",
  on_hold:  "bg-gray-100 text-gray-500 border border-gray-200",
  won:      "bg-blue-50 text-blue-700 border border-blue-200",
};

const STAGE_LABELS: Record<string, string> = {
  proposal:    "Proposal",
  negotiation: "Negotiation",
  discovery:   "Discovery",
  in_progress: "In Progress",
  closed_won:  "Closed Won",
};

const DEMO_FILES: Record<string, string[]> = {
  "demo-project-1": ["Thompson_Proposal_v2.pdf", "HMO_Fee_Schedule.xlsx"],
  "demo-project-2": ["Webb_Investment_Pack.pdf", "Salford_Yield_Analysis.xlsx", "Commission_Structure.pdf"],
  "demo-project-3": ["Hartley_Refurb_Contract.pdf", "Phase2_Scope.pdf", "Contractor_Invoice_May.pdf"],
  "demo-project-4": ["Osei_Discovery_Brief.pdf"],
};

type Project = typeof DEMO_PROJECTS[number];

export default function DealsProjectsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? DEMO_PROJECTS.find(p => p.id === selectedId) ?? null : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deals &amp; Projects</h1>
        <p className="text-gray-500 text-sm mt-1">{DEMO_PROJECTS.length} active deals and projects</p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-700 text-sm">
        Manage deals, projects, costs, progress, images, tasks and next actions from one operational view.
      </div>

      <div className={`grid gap-6 ${selected ? "lg:grid-cols-2" : "lg:grid-cols-2 xl:grid-cols-2"}`}>
        {/* Cards grid */}
        <div className={`grid gap-4 ${selected ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
          {DEMO_PROJECTS.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              isSelected={selectedId === project.id}
              onSelect={() => setSelectedId(selectedId === project.id ? null : project.id)}
            />
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <DetailPanel
            project={selected}
            files={DEMO_FILES[selected.id] ?? []}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  isSelected,
  onSelect,
}: {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`bg-white border rounded-xl shadow-sm p-5 transition-all cursor-pointer ${
        isSelected ? "border-indigo-400 ring-2 ring-indigo-100" : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm mb-1 truncate">{project.name}</div>
          <div className="text-xs text-gray-400">{project.contact_name}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[project.type]}`}>
            {project.type === "deal" ? "Deal" : "Project"}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[project.status]}`}>
            {project.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
        <span>{STAGE_LABELS[project.stage] ?? project.stage}</span>
        <span className="font-semibold text-gray-900">£{project.value.toLocaleString()}</span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 shrink-0">{project.progress}%</span>
      </div>

      {project.next_action && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{project.next_action}</p>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
      >
        View details →
      </button>
    </div>
  );
}

type UploadedFile = { name: string; preview?: string; isImage: boolean };

function DetailPanel({
  project,
  files,
  onClose,
}: {
  project: Project;
  files: string[];
  onClose: () => void;
}) {
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => { uploads.forEach(u => { if (u.preview) URL.revokeObjectURL(u.preview); }); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const added: UploadedFile[] = Array.from(fileList).map(f => ({
      name: f.name,
      isImage: f.type.startsWith("image/"),
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setUploads(prev => [...prev, ...added]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">{project.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{project.contact_name}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[project.type]}`}>
            {project.type === "deal" ? "Deal" : "Project"}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[project.status]}`}>
            {project.status.replace(/_/g, " ")}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
            {STAGE_LABELS[project.stage] ?? project.stage}
          </span>
        </div>

        {/* Description */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</div>
          <p className="text-sm text-gray-700 leading-relaxed">{project.description}</p>
        </div>

        {/* Key info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-0.5">Value</div>
            <div className="font-semibold text-gray-900">£{project.value.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-0.5">Probability</div>
            <div className="font-semibold text-gray-900">{project.probability}%</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-0.5">Expected Close</div>
            <div className="font-semibold text-gray-900">{project.expected_close}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-0.5">Progress</div>
            <div className="font-semibold text-gray-900">{project.progress}%</div>
          </div>
        </div>

        {/* Cost breakdown */}
        {project.cost_in !== null && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Cost Breakdown</div>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-200">
                  <tr><td className="px-4 py-2 text-gray-600">Income</td><td className="px-4 py-2 text-right font-medium text-gray-900">£{(project.cost_in ?? 0).toLocaleString()}</td></tr>
                  <tr><td className="px-4 py-2 text-gray-600">Costs</td><td className="px-4 py-2 text-right font-medium text-gray-900">£{(project.cost_out ?? 0).toLocaleString()}</td></tr>
                  <tr className="bg-emerald-50"><td className="px-4 py-2 text-emerald-700 font-semibold">Profit</td><td className="px-4 py-2 text-right font-bold text-emerald-700">£{(project.profit ?? 0).toLocaleString()}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Next action */}
        {project.next_action && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Next Action</div>
            <p className="text-sm text-amber-800">{project.next_action}</p>
          </div>
        )}

        {/* Contractor */}
        {project.contractor && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Contractor</div>
            <div className="text-sm text-gray-700">{project.contractor}</div>
          </div>
        )}

        {/* Existing files */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Files ({project.files_count + uploads.length})</div>
          <div className="space-y-1.5">
            {files.map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-base">📄</span>
                <span className="truncate">{f}</span>
              </div>
            ))}
            {/* Demo-uploaded files */}
            {uploads.map((u, i) => (
              <div key={i} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg p-2">
                {u.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.preview} alt={u.name} className="w-10 h-10 object-cover rounded-md shrink-0 border border-indigo-200" />
                ) : (
                  <span className="text-xl shrink-0">📄</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{u.name}</div>
                  <div className="text-xs text-indigo-600 font-medium">Uploaded in demo mode</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo upload area */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Upload File or Image</div>
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer"
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="text-2xl mb-2">📎</div>
            <p className="text-sm text-gray-500 mb-1">Click to upload or drag &amp; drop</p>
            <p className="text-xs text-gray-400">Images, PDFs, documents — demo mode</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
