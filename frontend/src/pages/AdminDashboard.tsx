import React, { useEffect, useState } from 'react';
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, Users, Plus, Eye, ListFilter } from 'lucide-react';
import { AdminStats, Project, Task } from '../types';
import { api } from '../services/api';
import { ActivityFeed } from '../components/ActivityFeed';
import { TaskFilterBar } from '../components/TaskFilterBar';
import { TaskCard } from '../components/TaskCard';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { useSearchParams, Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, projectsRes, tasksRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/projects'),
        api.get(`/tasks?${searchParams.toString()}`),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (projectsRes.data.success) setProjects(projectsRes.data.data);
      if (tasksRes.data.success) setTasks(tasksRes.data.data);
    } catch (err) {
      console.error('Error loading Admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchParams.toString()]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Admin Overview</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Full global control over agency projects, users, and tasks</p>
        </div>
        <button
          onClick={() => setIsProjectModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Projects</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.totalProjects || 0}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Across all clients</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasks Done</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats?.tasksByStatus.DONE || 0} <span className="text-xs text-slate-400 font-normal">/ {(stats?.tasksByStatus.TO_DO || 0) + (stats?.tasksByStatus.IN_PROGRESS || 0) + (stats?.tasksByStatus.IN_REVIEW || 0) + (stats?.tasksByStatus.DONE || 0)} Total</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {stats?.tasksByStatus.IN_PROGRESS || 0} In Progress · {stats?.tasksByStatus.IN_REVIEW || 0} In Review
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Tasks</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{stats?.overdueTaskCount || 0}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Flagged by background job</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Users</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2 flex items-center gap-2">
            {stats?.activeUsersOnline || 1}
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Live WebSocket presence</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-blue-600" /> Agency Projects ({projects.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                    <span className="font-extrabold text-blue-600">{project.client?.name}</span>
                    <span>By {project.createdBy?.name}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{project.title}</h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 leading-relaxed">{project.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-bold">
                    {project.tasks?.length || 0} tasks
                  </span>
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-extrabold transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Board
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ListFilter className="w-5 h-5 text-blue-600" /> All Tasks Explorer
              </h2>
              <span className="text-xs text-slate-500 font-bold">{tasks.length} tasks matched</span>
            </div>

            <TaskFilterBar />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onTaskUpdated={fetchData} />
              ))}
            </div>
          </div>
        </div>

        <div>
          <ActivityFeed />
        </div>
      </div>

      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onProjectCreated={fetchData}
      />
    </div>
  );
};
