import Link from "next/link";
import ProjectForm from "@/app/components/projects/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/projects" className="hover:text-gray-600 transition-colors">Projects</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">New Project</span>
      </nav>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add a Project</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new refurb or development project to track progress and costs.</p>
      </div>
      <ProjectForm mode="create" />
    </div>
  );
}
