import TaskForm from "@/app/components/tasks/TaskForm";
import Link from "next/link";

export default function NewTaskPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/tasks" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Tasks
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Task</h1>
        <p className="text-sm text-gray-500 mt-1">Add a task to your operational list.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <TaskForm />
      </div>
    </div>
  );
}
