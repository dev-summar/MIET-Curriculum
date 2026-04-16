import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import OverviewPage from "./pages/OverviewPage";
import SemestersPage from "./pages/SemestersPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import MatrixPage from "./pages/MatrixPage";
import POPage from "./pages/POPage";
import AdminPage from "./pages/AdminPage";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <Navbar currentPath={location.pathname} onNavigate={navigate} />
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/semesters" element={<SemestersPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/matrix" element={<MatrixPage />} />
        <Route path="/pos" element={<POPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
