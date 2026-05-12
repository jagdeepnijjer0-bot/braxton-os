"use client";

import Link from "next/link";
import { getTaskPriority, getTaskType, formatDueDate, isOverdue } from "@/lib/constants/tasks";
import TaskStatusBadge from "./TaskStatusBadge";
import type { Database, TaskStatus } from "@/lib/supabase/types";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

interface Props {
  task: TaskRow;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export default function TaskCard({ task, onStatusChange, onDelete, compact }: Props) {
  const priority = getTaskPriority(task.priority);
  const type     = getTaskType(task.task_type);
  const overdue  = isOverdue(task.due_date, task.status);
  const dueLabel = formatDueDate(task.due_date);

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow group ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-base flex-shrink-0" title={type.label}>{type.icon}</span>
          <span className={`font-semibold text-gray-900 truncate ${compact ? "text-sm" : "text-sm"} ${
            task.status === "completed" ? "line-through text-gray-400" : ""
          }`}>
            {task.title}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Link href={`/tasks/${task.id}/edit`}
            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </Link>
          <button onClick={() => onDelete(task.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>

      {!compact && task.description && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <TaskStatusBadge value={task.status} size="xs" />
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${priority.bg} ${priority.color}`}>
            {priority.label}
          </span>
        </div>
        {task.due_date && (
          <span className={`text-[10px] font-semibold ${
            overdue ? "text-red-600" : task.status === "completed" ? "text-gray-400" : "text-gray-500"
          }`}>
            {overdue && "⚠ "}{dueLabel}
          </span>
        )}
      </div>

      {task.status !== "completed" && task.status !== "cancelled" && (
        <div className="mt-2.5 pt-2 border-t border-gray-100 flex gap-1.5">
          {task.status !== "in_progress" && (
            <button
              onClick={() => onStatusChange(task.id, "in_progress" as TaskStatus)}
              className="flex-1 text-[10px] font-semibold py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
              Start
            </button>
          )}
          <button
            onClick={() => onStatusChange(task.id, "completed" as TaskStatus)}
            className="flex-1 text-[10px] font-semibold py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
            Complete
          </button>
        </div>
      )}
    </div>
  );
}
