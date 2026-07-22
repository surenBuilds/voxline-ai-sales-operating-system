import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Sparkles } from 'lucide-react';
import { KBArticle } from '../types/index.js';

interface KnowledgeBaseViewProps {
  lang: 'am' | 'en';
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ lang }) => {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newArticle, setNewArticle] = useState({
    category: 'Services',
    title: '',
    content: ''
  });

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/kb');
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error('Fetch KB error:', err);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArticle)
      });
      setShowAddModal(false);
      setNewArticle({ category: 'Services', title: '', content: '' });
      fetchArticles();
    } catch (err) {
      console.error('Add KB error:', err);
    }
  };

  const filteredArticles = selectedCategory === 'all'
    ? articles
    : articles.filter(a => a.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>Voxline AI Knowledge Base & RAG Index</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Grounded source of truth for Voxline Sales Agent, Objection Handling, and Service Pricing.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Knowledge Article</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category List */}
        <div className="space-y-2 bg-slate-900 border border-slate-800 p-4 rounded-2xl h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categories</h3>
          {['all', 'Company', 'Services', 'Products', 'Pricing', 'FAQ', 'Sales Scripts', 'Objection Handling', 'Policies'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition ${
                selectedCategory === cat ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Article Cards Grid */}
        <div className="md:col-span-2 space-y-4">
          {filteredArticles.map(article => (
            <div key={article.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {article.category}
                </span>
                <span className="text-xs text-slate-500">v{article.version}</span>
              </div>
              <h3 className="font-bold text-white text-base">{article.title}</h3>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{article.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Knowledge Base Article</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={newArticle.category}
                  onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Services">Services</option>
                  <option value="Pricing">Pricing</option>
                  <option value="Sales Scripts">Sales Scripts</option>
                  <option value="Objection Handling">Objection Handling</option>
                  <option value="Company">Company</option>
                  <option value="FAQ">FAQ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Content</label>
                <textarea
                  rows={4}
                  required
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Save & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
