import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import YouTuberHome from './components/YouTuber/YouTuberHome';
import EditorHome from './components/Editor/EditorHome';
import { jwtDecode } from 'jwt-decode';
import GoogleCallback from "./components/GoogleCallback.jsx";
import UploadResult from "./components/UploadResult.jsx";

const App = () => {
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [userRole, setUserRole] = useState(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decodedToken = jwtDecode(storedToken);
                return decodedToken.role;
            } catch (error) {
                console.error('Error decoding token:', error);
                localStorage.removeItem('token');
                return '';
            }
        }
        return '';
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUserRole(decodedToken.role);
            } catch (error) {
                console.error('Error decoding token:', error);
                setToken(null);
                setUserRole('');
                localStorage.removeItem('token');
            }
        } else {
            setUserRole('');
            localStorage.removeItem('token');
        }
        setIsLoading(false);
    }, [token]);

    const handleLogin = (newToken) => {
        setToken(newToken);
        localStorage.setItem('token', newToken);
        const decodedToken = jwtDecode(newToken);
        setUserRole(decodedToken.role);
    };

    if (isLoading) {
        return <div>Loading...</div>; // Or a loading spinner
    }

    return (
        <Router>
            <div>
                <Routes>
                    <Route path="/" element={<Register />} />
                    <Route path="/login" element={<Login setToken={handleLogin} />} />
                    <Route
                        path="/youtuber-home"
                        element={
                            token && userRole === 'YouTuber' ?
                                <YouTuberHome token={token} setToken={setToken} /> :
                                <Navigate to="/login" />
                        }
                    />
                    <Route
                        path="/editor-home"
                        element={
                            token && userRole === 'Editor' ?
                                <EditorHome token={token} setToken={setToken} /> :
                                <Navigate to="/login" />
                        }
                    />

                    <Route path="/auth/google/callback" element={<GoogleCallback />} />
                    <Route path="/upload-result" element={<UploadResult/>} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;