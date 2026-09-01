import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProgramsList from './pages/ProgramList.jsx';
import ProgramDetail from './pages/ProgramDetails.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/programs" element={<ProtectedRoute><ProgramsList /></ProtectedRoute>} />
          <Route path="/programs/:id" element={<ProtectedRoute><ProgramDetail /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/programs" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}