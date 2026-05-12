import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import ProjectForm from "@/app/components/projects/ProjectForm";

interface Props { params: Promise<{ id: string }> }

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: project, error } = await supabase
    .from("projects").select("*").eq("id", id).single();

  if (error || !project) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href="/projects" className="hover:text-gray-600 transition-colors">Projects</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <Link href={`/projects/${id}`} className="hover:text-gray-600 transition-colors truncate max-w-[200px]">{project.project_name}</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Edit</span>
      </nav>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
        <p className="text-sm text-gray-500 mt-1">Update details for <span className="font-medium text-gray-700">{project.project_name}</span>.</p>
      </div>
      <ProjectForm mode="edit" projectId={id} initial={project} />
    </div>
  );
}
