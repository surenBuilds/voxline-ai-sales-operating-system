import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, Activity, Terminal } from 'lucide-react';
import { Agent, AgentJob } from '../types/index.js';

interface AgentControlCenterProps {
  lang: 'am' | 'en';
}

export const AgentControlCenter: React.FC<AgentControlCenterProps> = ({ lang }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [jobs, setJobs] = useState<AgentJob[]>([]);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      setAgents(data.agents || []);
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Fetch agents error:', err);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <span>Voxline Brain — Central Orchestration & Agent Queue</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time worker execution state for all 7 connected AI agents in the Voxline ecosystem.
          </p>
        </div>

        <button
          onClick={fetchAgents}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Agents Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {agents.map((ag) => (
          <div key={ag.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-xs">{ag.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-[11px] text-slate-400 capitalize">Type: {ag.type}</div>
            <div className="text-[10px] text-cyan-400 font-medium">Status: {ag.status.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Execution Jobs Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          <span>Recent Execution Jobs Queue ({jobs.length})</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="py-2.5 px-3">Job ID</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Retry Count</th>
                <th className="py-2.5 px-3">Output / Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-cyan-400">{j.id}</td>
                  <td className="py-2.5 px-3 font-semibold">{j.job_type}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        j.status === 'success'
                          ? 'bg-emerald-950 text-emerald-400'
                          : j.status === 'failed'
                          ? 'bg-rose-950 text-rose-400'
                          : 'bg-blue-950 text-blue-400 animate-pulse'
                      }`}
                    >
                      {j.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">{j.retry_count}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 truncate max-w-xs">
                    {JSON.stringify(j.output || j.input)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
