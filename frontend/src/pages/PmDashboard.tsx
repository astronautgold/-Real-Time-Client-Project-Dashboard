import React, { useEffect, useState } from 'react';
import { FolderKanban, Plus, Clock, AlertTriangle, Calendar, Eye, ListFilter } from 'lucide-react';
import { PmStats, Project, Task } from '../types';
import { api } from '../services/api';
import { ActivityFeed } from '../components/ActivityFeed';
import { TaskFilterBar } from '../components/TaskFilterBar';
import { TaskCard } from '../components/TaskCard';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { useSearchParams, Link } from 'react-router-dom';

export const PmDashboard: React.FC = () => {
  const [stats, setStats] = useState<PmStats | null>(null);
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
      console.error('Error loading PM dashboard data:', err);
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project Manager Control Panel</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Manage your assigned projects, team tasks, and review pipeline</p>
        </div>
        <button
          onClick={() => setIsProjectModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create New Project
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Projects</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.myProjectsCount || 0}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Created by you</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasks by Priority</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-sm font-extrabold mt-2 flex flex-wrap gap-2">
            <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-lg">
              {stats?.tasksByPriority.CRITICAL || 0} Critical
            </span>
            <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg">
              {stats?.tasksByPriority.HIGH || 0} High
            </span>
            <span className="bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-lg">
              {stats?.tasksByPriority.MEDIUM || 0} Med
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Active priority queue</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Due This Week</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {stats?.upcomingTasksThisWeek.length || 0}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Due within 7 days</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-blue-600" /> My Projects ({projects.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-extrabold text-blue-600">{project.client?.name}</span>
                  <h3 className="text-base font-bold text-slate-900 mt-1 mb-2">{project.title}</h3>
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
                    <Eye className="w-3.5 h-3.5" /> Manage Board
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ListFilter className="w-5 h-5 text-blue-600" /> My Team's Tasks Explorer
              </h2>
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
