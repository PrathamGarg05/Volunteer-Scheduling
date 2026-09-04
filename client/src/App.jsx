import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProgramsList from './pages/ProgramList.jsx';
import ProgramDetail from './pages/ProgramDetails.jsx';
import NavBar from './components/NavBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ShiftSearch from './pages/ShiftSearch.jsx';
import Alerts from "./pages/Alerts";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <main className="min-h-screen bg-slate-50">
          <NavBar />
          <div className="max-w-4xl mx-auto p-6">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/programs" element={<ProtectedRoute><ProgramsList /></ProtectedRoute>} />
              <Route path="/programs/:id" element={<ProtectedRoute><ProgramDetail /></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/programs" replace />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>
              <Route path="/search" element={<ProtectedRoute><ShiftSearch /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            </Routes>
          </div>
        </main>
        
        
      </BrowserRouter>
    </AuthProvider>
  );
}