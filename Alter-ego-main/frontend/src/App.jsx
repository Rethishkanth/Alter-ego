import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import AnalysisPage from './pages/AnalysisPage';
import ChatPage from './pages/ChatPage';
import AutopsyPage from './pages/AutopsyPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<UploadPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/autopsy" element={<AutopsyPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
