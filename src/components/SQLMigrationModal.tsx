import React, { useState, useEffect } from 'react';
import { Database, Copy, Check, Download } from 'lucide-react';

interface SQLMigrationModalProps {
  onClose: () => void;
}

export const SQLMigrationModal: React.FC<SQLMigrationModalProps> = ({ onClose }) => {
  const [sql, setSql] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/migrations/sql')
      .then(res => res.text())
      .then(text => {
        setSql(text);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch SQL error:', err);
        setLoading(false);
      });
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voxline_supabase_migration.sql';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Supabase / PostgreSQL SQL Migration Script</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Generating Supabase DDL SQL...</div>
        ) : (
          <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-indigo-200 overflow-y-auto max-h-[450px] whitespace-pre">
            {sql}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .sql File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
