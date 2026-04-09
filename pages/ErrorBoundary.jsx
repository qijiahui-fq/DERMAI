import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('全局错误捕获:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center bg-white rounded-3xl border border-red-100 shadow-sm">
          <h2 className="text-red-600 font-bold text-xl mb-2">页面渲染异常</h2>
          <p className="text-slate-500 mb-4">请刷新页面或检查网络连接</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700">
            刷新重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
