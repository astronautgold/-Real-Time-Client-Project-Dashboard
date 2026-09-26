import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, RotateCcw, Calendar } from 'lucide-react';
import { TaskStatus, TaskPriority } from '../types';

export const TaskFilterBar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const search = searchParams.get('search') || '';

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = status || priority || startDate || endDate || search;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <select
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="TO_DO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <select
            value={priority}
            onChange={(e) => updateParam('priority', e.target.value)}
            className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => updateParam('startDate', e.target.value)}
            className="bg-transparent text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
            title="Start Due Date"
          />
          <span className="text-slate-400 font-bold">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => updateParam('endDate', e.target.value)}
            className="bg-transparent text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
            title="End Due Date"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition font-bold border border-rose-200"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};
