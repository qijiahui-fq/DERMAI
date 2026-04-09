// @ts-nocheck
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; 

const mountApp = () => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
        const root = ReactDOM.createRoot(rootElement);
        root.render(<App />);
        console.log("DermAI: System initialized.");
    }
};

// 确保在浏览器环境及 DOM 加载后运行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApp);
} else {
    mountApp();
}
