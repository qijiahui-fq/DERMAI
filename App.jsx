/** @jsx React.createElement */
// @ts-nocheck
import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { Beaker } from 'lucide-react';

// 🚀 核心改动：后缀全部对齐为 .jsx
import Dashboard from './pages/Dashboard.jsx';
import TargetID from './pages/TargetID.jsx';
import KnowledgeGraph from './pages/KnowledgeGraph.jsx';

const Navbar = () => (
  <nav className="bg-white border-b border-slate-200 px-4 flex justify-between h-16 items-center sticky top-0 z-50">
    <Link to="/" className="flex items-center gap-2">
      <div className="p-2 bg-indigo-600 rounded text-white shadow-lg shadow-indigo-200">
        <Beaker size={20} />
      </div>
      <span className="text-xl font-black text-slate-800 tracking-tight">DermAI</span>
    </Link>
    <div className="flex gap-1 text-sm font-bold">
      <Link to="/" className="px-4 py-2 text-slate-500 hover:text-indigo-600">药研中心</Link>
      <Link to="/target-id" className="px-4 py-2 text-slate-500 hover:text-indigo-600">靶点识别</Link>
      <Link to="/knowledge-graph" className="px-4 py-2 text-slate-500 hover:text-indigo-600">知识图谱</Link>
    </div>
  </nav>
);

const App = () => (
  <HashRouter>
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/target-id" element={<TargetID />} />
          <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
      <footer className="bg-white border-t border-slate-100 py-4 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 DermAI Data Empowerment Department</p>
      </footer>
    </div>
  </HashRouter>
);

export default App;
