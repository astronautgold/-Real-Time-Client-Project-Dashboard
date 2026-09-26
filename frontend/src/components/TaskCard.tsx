import React, { useState } from 'react';
import { Calendar, AlertCircle, Clock, User } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TaskCardProps {
  task: Task;
  onTaskUpdated?: (updatedTask: Task) => void;
}

const priorityColors: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
  MEDIUM: 'bg-sky-100 text-sky-800 border-sky-200',
  HIGH: 'bg-amber-100 text-amber-800 border-amber-200',
  CRITICAL: 'bg-rose-100 text-rose-800 border-rose-200 font-black shadow-xs',
};

const statusColors: Record<TaskStatus, string> = {
  TO_DO: 'bg-slate-100 text-slate-800 border border-slate-300 font-bold',
  IN_PROGRESS: 'bg-blue-600 text-white font-bold shadow-sm',
  IN_REVIEW: 'bg-amber-500 text-white font-bold shadow-sm',
  DONE: 'bg-emerald-600 text-white font-bold shadow-sm',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskUpdated }) => {
  const { user } = useAuth();
  const [updating, setUpdating] = useState<boolean>(false);
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task.status);

  const canUpdateStatus =
    user?.role === 'ADMIN' ||
    (user?.role === 'DEVELOPER' && task.assignedToId === user.id) ||
    (user?.role === 'PROJECT_MANAGER' && task.project?.createdById === user.id);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === currentStatus || updating) return;

    try {
      setUpdating(true);
      setCurrentStatus(newStatus);
      const res = await api.patch(`/tasks/${task.id}/status`, { status: newStatus });
      if (res.data.success && onTaskUpdated) {
        onTaskUpdated(res.data.data);
      }
    } catch (err: any) {
      console.error('Error updating task status:', err);
      setCurrentStatus(task.status);
      alert(err.response?.data?.error?.message || 'Failed to update task status');
    } finally {
      setUpdating(false);
    }
  };

  const isOverdue = task.isOverdue || (new Date(task.dueDate) < new Date() && task.status !== 'DONE');

  return (
    <div
      className={`bg-white border rounded-2xl p-4.5 shadow-sm transition duration-200 hover:shadow-md hover:border-slate-300 flex flex-col justify-between ${
        isOverdue ? 'border-rose-300 bg-rose-50/40 ring-1 ring-rose-200' : 'border-slate-200/90'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
              priorityColors[task.priority]
            }`}
          >
            {task.priority}
          </span>
          {isOverdue && task.status !== 'DONE' && (
            <span className="flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300 tracking-wider">
              <AlertCircle className="w-3 h-3 text-rose-600" /> OVERDUE
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-2 leading-snug">{task.title}</h3>
        <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed font-medium">{task.description}</p>
      </div>

      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5 text-xs">
        <div className="flex items-center justify-between text-slate-600">
          <span className="flex items-center gap-1.5 text-slate-800 font-bold">
            <User className="w-3.5 h-3.5 text-blue-600" />
            {task.assignedTo?.name || 'Unassigned'}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] font-bold text-slate-500">Status:</span>
          {canUpdateStatus ? (
            <select
              value={currentStatus}
              disabled={updating}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer border-0 transition shadow-xs ${
                statusColors[currentStatus]
              }`}
            >
              <option value="TO_DO" className="bg-white text-slate-900 font-semibold">To Do</option>
              <option value="IN_PROGRESS" className="bg-white text-slate-900 font-semibold">In Progress</option>
              <option value="IN_REVIEW" className="bg-white text-slate-900 font-semibold">In Review</option>
              <option value="DONE" className="bg-white text-slate-900 font-semibold">Done</option>
            </select>
          ) : (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                statusColors[currentStatus]
              }`}
            >
              {currentStatus.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
