import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, FolderKanban, Building2, UserCheck, ShieldAlert } from 'lucide-react';
import { Project, Task, TaskStatus } from '../types';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { TaskCard } from '../components/TaskCard';
import { CreateTaskModal } from '../components/CreateTaskModal';

const columns: { id: TaskStatus; title: string; columnBg: string; headerBadge: string }[] = [
  { id: 'TO_DO', title: 'To Do', columnBg: 'bg-slate-100/70 border-slate-200', headerBadge: 'bg-slate-200 text-slate-800' },
  { id: 'IN_PROGRESS', title: 'In Progress', columnBg: 'bg-blue-50/70 border-blue-200/80', headerBadge: 'bg-blue-600 text-white' },
  { id: 'IN_REVIEW', title: 'In Review', columnBg: 'bg-amber-50/70 border-amber-200/80', headerBadge: 'bg-amber-500 text-white' },
  { id: 'DONE', title: 'Done', columnBg: 'bg-emerald-50/70 border-emerald-200/80', headerBadge: 'bg-emerald-600 text-white' },
];

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const { socket, joinProjectBoard, leaveProjectBoard } = useSocket();
  const { user } = useAuth();

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/projects/${id}`);
      if (res.data.success) {
        setProject(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();

    if (id) {
      joinProjectBoard(id);
    }

    return () => {
      if (id) {
        leaveProjectBoard(id);
      }
    };
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleTaskUpdated = (updatedTask: Task) => {
      setProject((prev) => {
        if (!prev) return null;
        const exists = prev.tasks?.some((t) => t.id === updatedTask.id);
        const newTasks = exists
          ? prev.tasks?.map((t) => (t.id === updatedTask.id ? updatedTask : t))
          : [...(prev.tasks || []), updatedTask];
        return { ...prev, tasks: newTasks };
      });
    };

    socket.on('task:updated', handleTaskUpdated);

    return () => {
      socket.off('task:updated', handleTaskUpdated);
    };
  }, [socket, id]);

  if (loading) {
    return <div className="py-12 text-center text-slate-500 text-xs font-semibold">Loading project board...</div>;
  }

  if (error || !project) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="text-rose-600 text-xs font-bold">{error || 'Project not found'}</div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-extrabold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const canCreateTask = user?.role === 'ADMIN' || (user?.role === 'PROJECT_MANAGER' && project.createdById === user.id);

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-bold mb-3 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                {project.client?.name} ({project.client?.company})
              </span>
              <span className="text-xs text-slate-500 font-medium">Created by {project.createdBy?.name}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{project.title}</h1>
            <p className="text-xs text-slate-600 font-medium mt-1 max-w-3xl leading-relaxed">{project.description}</p>
          </div>

          {canCreateTask && (
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 transition self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const columnTasks = project.tasks?.filter((t) => t.status === col.id) || [];

          return (
            <div
              key={col.id}
              className={`border rounded-2xl p-4 flex flex-col min-h-[520px] shadow-xs ${col.columnBg}`}
            >
              <div className="pb-3 mb-3 border-b border-slate-200/80 flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  {col.title}
                </h2>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs ${col.headerBadge}`}>
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {columnTasks.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold italic">
                    No tasks in {col.title}
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onTaskUpdated={fetchProjectDetails} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {canCreateTask && (
        <CreateTaskModal
          isOpen={isTaskModalOpen}
          projectId={project.id}
          onClose={() => setIsTaskModalOpen(false)}
          onTaskCreated={fetchProjectDetails}
        />
      )}
    </div>
  );
};
