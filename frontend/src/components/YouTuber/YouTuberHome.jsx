import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from "react-router-dom";
import axios from 'axios';
import {jwtDecode} from "jwt-decode";

const YouTuberHome = ({ token, setToken }) => {
    const [activeTab, setActiveTab] = useState('raw');
    const [secretKey, setSecretKey] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [rawVideos, setRawVideos] = useState([]);
    const [editedVideos, setEditedVideos] = useState([]);
    const [isCopyingKey, setIsCopyingKey] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isSubmittingRawVideo, setIsSubmittingRawVideo] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            fetchSecretKey();
            fetchRawVideos();
            fetchEditedVideos();
        } else {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                handlePublishToYouTube(event.data.videoId);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const fetchSecretKey = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/auth/fetch-secret-key', {
                headers: { Authorization: token }
            });
            const key = response.data.secretKey;
            setSecretKey(key);
        } catch (error) {
            console.error('Error fetching secret key:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRawVideos = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/file/raw', {
                headers: { Authorization: token }
            });
            setRawVideos(response.data);
        } catch (e) {
            console.log(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEditedVideos = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/file/edited', {
                headers: { Authorization: token }
            });
            setEditedVideos(response.data);
        } catch (e) {
            console.log(e);
            alert('Error Fetching Edited Videos!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        setIsLoggingOut(true);
        setToken(null);
        localStorage.removeItem('token');
        navigate('/login');
    };

    const copySecretKey = () => {
        setIsCopyingKey(true);
        if (secretKey) {
            navigator.clipboard.writeText(secretKey)
                .then(() => {
                    setIsCopyingKey(false);
                    alert('Secret key copied to clipboard!');
                })
                .catch(err => {
                    setIsCopyingKey(false);
                    console.error('Failed to copy: ', err);
                });
        } else {
            setIsCopyingKey(false);
            alert('No secret key available');
        }
    };

    const handleRawVideoChange = (event) => {
        console.log('Selecting raw video:', event.target.files[0]);
        setSelectedFile(event.target.files[0]);
    };

    const handleSubmitRawVideo = async () => {
        setIsSubmittingRawVideo(true);
        try {
            if (!selectedFile) {
                alert('Please select a file first');
                setIsSubmittingRawVideo(false);
                return;
            }
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append("upload_preset", "rawvideo");
            const api = 'https://api.cloudinary.com/v1_1/djtrvplmk/video/upload';
            const cloudinaryRes = await axios.post(api, formData);

            const videoUrl = cloudinaryRes.data.secure_url;
            console.log(videoUrl);
            const apiRes = await axios.post('http://localhost:8000/api/file/save-raw', {
                filePath: videoUrl,
                filename: selectedFile.name
            }, {
                headers: { Authorization: token }
            });
            console.log('Video saved:', apiRes.data);
            alert('Video uploaded successfully!');
            fetchRawVideos();
            setSelectedFile(null);
        } catch (e) {
            console.log(e);
            alert('Failed to upload video. Please try again.');
        } finally {
            setIsSubmittingRawVideo(false);
        }
    };

    const handlePublishToYouTube = async (videoId) => {
        try {
            const decodedToken = jwtDecode(token);
            const userId = decodedToken.userId;
            const response = await axios.get('http://localhost:8000/auth/google', {
                params: { userId, videoId },
                headers: { Authorization: token }
            });
            window.open(response.data.authUrl, '_blank', 'width=500,height=600');
        } catch (error) {
            console.error('Error initiating YouTube publishing:', error);
            alert('Failed to initiate YouTube publishing. Please try again.');
        }
    };

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
            <nav className="bg-gray-900 bg-opacity-50 backdrop-blur-md px-6 md:px-12 py-4 flex justify-between items-center">
                <h1 className="text-white text-2xl font-bold">Streamline Studio</h1>
                <div>
                    <button onClick={copySecretKey} disabled={isCopyingKey} className={`bg-yellow-500 bg-opacity-80 text-white px-4 py-2 rounded mr-2 hover:bg-yellow-600 transition-colors duration-300 ${isCopyingKey ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isCopyingKey ? 'Copying...' : 'Copy Secret Key'}
                    </button>
                    <button onClick={handleLogout} disabled={isLoggingOut} className={`bg-red-500 bg-opacity-80 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors duration-300 ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isLoggingOut ? 'Logging Out...' : 'Logout'}
                    </button>
                </div>
            </nav>

            <div className="mt-8 px-6 md:px-12 py-4">
                <div className="flex flex-col md:flex-row mb-4">
                    <button
                        onClick={() => setActiveTab('raw')}
                        className={`mr-0 md:mr-2 mb-2 md:mb-0 px-4 py-2 rounded ${activeTab === 'raw' ? 'bg-blue-500 bg-opacity-80 text-white' : 'bg-gray-700'}`}
                    >
                        Upload Raw Video
                    </button>
                    <button
                        onClick={() => setActiveTab('youtube')}
                        className={`px-4 py-2 rounded ${activeTab === 'youtube' ? 'bg-blue-500 bg-opacity-80 text-white' : 'bg-gray-700'}`}
                    >
                        Upload to YouTube
                    </button>
                </div>

                {activeTab === 'raw' && (
                    <div className="bg-white bg-opacity-20 backdrop-blur-md p-6 rounded shadow-md">
                        <h2 className="text-xl font-bold mb-4">Upload Raw Video</h2>
                        <input
                            type="file"
                            onChange={handleRawVideoChange}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                        />
                        <button
                            onClick={handleSubmitRawVideo}
                            disabled={isSubmittingRawVideo}
                            className={`mt-4 bg-blue-500 bg-opacity-80 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-300 ${isSubmittingRawVideo ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSubmittingRawVideo ? 'Uploading...' : 'Submit Video'}
                        </button>
                        <h3 className="text-lg font-bold mt-6 mb-2">Raw Videos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {rawVideos.map((video, index) => (
                                <div key={index} className="bg-gray-700 bg-opacity-50 backdrop-blur-md p-4 rounded">
                                    <video
                                        controls muted
                                        className="w-full h-48 object-cover"
                                        src={video.filePath}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                    <p className="mt-2">{video.filename}</p>
                                    <p className="text-sm text-gray-400">
                                        Uploaded: {new Date(video.uploadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'youtube' && (
                    <div className="bg-white bg-opacity-20 backdrop-blur-md p-6 rounded shadow-md">
                        <h3 className="text-lg font-bold mt-6 mb-2">Edited Videos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {editedVideos.map((video, index) => (
                                <div key={index} className="bg-gray-700 bg-opacity-50 backdrop-blur-md p-4 rounded">
                                    <video
                                        controls muted
                                        className="w-full h-48 object-cover"
                                        src={video.filePath}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                    <p className="mt-2">{video.filename}</p>
                                    <p className="text-sm text-gray-400">
                                        Uploaded: {new Date(video.uploadedAt).toLocaleDateString()}
                                    </p>
                                    <button
                                        onClick={() => handlePublishToYouTube(video._id)}
                                        className={`mt-2 bg-green-500 bg-opacity-80 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-300 `}
                                    >
                                        Publish to YouTube
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default YouTuberHome;
