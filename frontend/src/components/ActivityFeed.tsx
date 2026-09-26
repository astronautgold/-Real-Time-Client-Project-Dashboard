import React, { useEffect, useState } from 'react';
import { Activity, Clock, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { ActivityLog } from '../types';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { socket } = useSocket();

  const fetchActivityFeed = async () => {
    try {
      setLoading(true);
      const res = await api.get('/activity-feed?limit=20');
      if (res.data.success) {
        setActivities(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch activity feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityFeed();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (newActivity: ActivityLog) => {
      setActivities((prev) => [newActivity, ...prev.slice(0, 19)]);
    };

    socket.on('activity:new', handleNewActivity);

    return () => {
      socket.off('activity:new', handleNewActivity);
    };
  }, [socket]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Live Activity Feed</h2>
            <p className="text-xs text-slate-500 font-medium">Real-time role-filtered events</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          Live
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-400 text-xs font-medium">Loading activity feed...</div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs font-medium">No activity events recorded yet.</div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {activities.map((act) => (
            <div
              key={act.id}
              className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition duration-150 flex items-start gap-3 text-xs"
            >
              <div className="mt-0.5 shrink-0">
                {act.action === 'OVERDUE_FLAGGED' ? (
                  <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                ) : act.action === 'ASSIGNED' ? (
                  <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                    <UserCheck className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-slate-800 font-bold leading-relaxed">
                  {act.details}
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="font-extrabold text-blue-700">{act.project?.title || 'Project'}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    {timeAgo(act.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
