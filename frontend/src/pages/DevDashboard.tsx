import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, ListFilter, UserCheck } from 'lucide-react';
import { DevStats, Task } from '../types';
import { api } from '../services/api';
import { ActivityFeed } from '../components/ActivityFeed';
import { TaskFilterBar } from '../components/TaskFilterBar';
import { TaskCard } from '../components/TaskCard';
import { useSearchParams } from 'react-router-dom';

export const DevDashboard: React.FC = () => {
  const [stats, setStats] = useState<DevStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, tasksRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get(`/tasks?${searchParams.toString()}`),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (tasksRes.data.success) setTasks(tasksRes.data.data);
    } catch (err) {
      console.error('Error loading Developer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchParams.toString()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Developer Task Queue</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Your assigned tasks sorted strictly by priority and due date</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Tasks</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.totalAssignedTasks || 0}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Assigned to you</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Progress</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {stats?.tasksByStatus.IN_PROGRESS || 0}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Active development</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Tasks</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {stats?.tasksByStatus.DONE || 0}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Successfully delivered</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-blue-600" /> My Assigned Tasks ({tasks.length})
            </h2>
          </div>

          <TaskFilterBar />

          {tasks.length === 0 ? (
            <div className="py-12 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-semibold shadow-xs">
              No assigned tasks matching selected filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onTaskUpdated={fetchData} />
              ))}
            </div>
          )}
        </div>

        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};
