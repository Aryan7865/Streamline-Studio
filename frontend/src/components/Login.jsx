import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import { BiSolidHide,BiSolidShow } from "react-icons/bi";

const Login = ({ setToken }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const onChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const onSubmit = async e => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await axios.post('http://localhost:8000/api/auth/login', formData);
            const token = res.data.token;
            setToken(token); // This will update both token and userRole in App.js
            const decodedToken = jwtDecode(token);
            navigate(decodedToken.role === 'YouTuber' ? '/youtuber-home' : '/editor-home');
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
            <div className="bg-glass p-8 rounded-lg shadow-lg w-96">
                <h1 className="text-4xl font-bold mb-4 text-white text-center">Streamline Studio</h1>
                <p className="text-lg mb-4 text-white text-center">Welcome back to Streamline Studio! Log in to continue.</p>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={onSubmit}>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={onChange}
                        placeholder="Email"
                        className="w-full p-2 border border-gray-700 rounded mb-4 bg-gray-700 text-white"
                        required
                    />
                    <div className="relative flex items-center">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={onChange}
                            placeholder="Password"
                            className="w-full p-2 border border-gray-700 rounded mb-4 bg-gray-700 text-white"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400"
                        >
                            {showPassword ? <BiSolidHide /> : <BiSolidShow />}
                        </button>
                    </div>
                    <button
                        type="submit"
                        className={`w-full bg-blue-500 text-white p-2 rounded transition duration-300 hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                    <p className="mt-4 text-center text-white">
                        Don't have an account? <a href="/" className="text-blue-400 transition duration-300 hover:text-blue-500 hover:underline"> Register here</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
