import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BiSolidHide, BiSolidShow } from "react-icons/bi";

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: ''
    });

    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const onChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const onSubmit = async e => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const dataToSend = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            role: formData.role
        }

        setIsLoading(true);
        try {
            await axios.post('http://localhost:8000/api/auth/register', dataToSend);
            setSuccess(true);
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
                <p className="text-lg mb-4 text-white text-center">Welcome to Streamline Studio! Sign up to streamline your video production workflow.</p>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success ? (
                    <div>
                        <p className="text-green-500 mb-4">You are successfully registered!</p>
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded transition duration-300 hover:bg-blue-600"
                            onClick={() => navigate('/login')}
                        >
                            Log in to your account
                        </button>
                    </div>
                ) : (
                    <form onSubmit={onSubmit}>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={onChange}
                            placeholder="Username"
                            className="w-full p-2 border border-gray-700 rounded mb-4 bg-gray-700 text-white"
                            required
                        />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={onChange}
                            placeholder="Email"
                            className="w-full p-2 border border-gray-700 rounded mb-4 bg-gray-700 text-white"
                            required
                        />
                        <div className="relative flex items-center mb-4">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={onChange}
                                placeholder="Password"
                                className="w-full p-2 border border-gray-700 rounded bg-gray-700 text-white"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 text-gray-400"
                            >
                                {showPassword ? <BiSolidHide /> : <BiSolidShow />}
                            </button>
                        </div>
                        <div className="relative flex items-center mb-4">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={onChange}
                                placeholder="Confirm password"
                                className="w-full p-2 border border-gray-700 rounded bg-gray-700 text-white"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 text-gray-400"
                            >
                                {showConfirmPassword ? <BiSolidHide /> : <BiSolidShow />}
                            </button>
                        </div>

                        <h3 className="mb-3 text-base font-medium text-white">What's your role?</h3>
                        <ul className="grid w-full gap-3 md:grid-cols-2 mb-4">
                            <li>
                                <input
                                    type="radio"
                                    id="role-editor"
                                    name="role"
                                    value="Editor"
                                    className="hidden peer"
                                    required
                                    checked={formData.role === 'Editor'}
                                    onChange={onChange}
                                />
                                <label htmlFor="role-editor" className="inline-flex items-center justify-between w-full p-3 text-gray-500 bg-white border border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                                    <div className="block">
                                        <div className="w-full text-lg font-semibold">Editor</div>
                                        <div className="w-full text-sm">I edit videos</div>
                                    </div>
                                </label>
                            </li>
                            <li>
                                <input
                                    type="radio"
                                    id="role-youtuber"
                                    name="role"
                                    value="YouTuber"
                                    className="hidden peer"
                                    checked={formData.role === 'YouTuber'}
                                    onChange={onChange}
                                />
                                <label htmlFor="role-youtuber" className="inline-flex items-center justify-between w-full p-3 text-gray-500 bg-white border border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                                    <div className="block">
                                        <div className="w-full text-lg font-semibold">YouTuber</div>
                                        <div className="w-full text-sm">I create content</div>
                                    </div>
                                </label>
                            </li>
                        </ul>

                        <button
                            type="submit"
                            className={`w-full bg-blue-500 text-white p-2 rounded transition duration-300 hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating account...' : 'Create an account'}
                        </button>
                        <p className="mt-4 text-center text-white">
                            Already have an account? <a href="/login" className="text-blue-400 transition duration-300 hover:text-blue-500 hover:underline">Login here</a>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Register;