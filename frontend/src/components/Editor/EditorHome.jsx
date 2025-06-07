import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from "react-router-dom";
import axios from 'axios';
import Modal from 'react-modal';
import { BiSolidHide, BiSolidShow } from "react-icons/bi";

const EditorHome = ({ token, setToken }) => {
    const [activeTab, setActiveTab] = useState('download');
    const [secretKey, setSecretKey] = useState('');
    const [youtuberEmailInput, setYoutuberEmailInput] = useState('');
    const [youtuberEmail, setYoutuberEmail] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [rawVideos, setRawVideos] = useState([]);
    const [editedVideos, setEditedVideos] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showSecretKey, setShowSecretKey] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            fetchRawVideos();
            fetchEditedVideos();
        }
    }, [token]);

    const handleLogout = () => {
        setToken(null);
        localStorage.removeItem('token');
        navigate('/login');
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSecretKeyChange = (e) => {
        setSecretKey(e.target.value);
    };

    const handleYoutuberEmailChange = (e) => {
        setYoutuberEmailInput(e.target.value);
    };

    const validateSecretKey = async () => {
        try {
            setIsLoading(true);
            const response = await axios.post('http://localhost:8000/api/auth/validate-secret', {
                email: youtuberEmailInput, secretKey
            }, {
                headers: { Authorization: token }
            });
            setYoutuberEmail(response.data.youtuber.username);
            closeModal();
        } catch (error) {
            console.error('Error validating secret key:', error);
            alert('Invalid email or secret key');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRawVideos = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('http://localhost:8000/api/file/raw', {
                headers: { Authorization: token }
            });
            setRawVideos(response.data);
        } catch (e) {
            console.error(e);
            alert("Could not fetch raw videos!");
        } finally {
            setIsLoading(false);
        }
    }

    const fetchEditedVideos = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('http://localhost:8000/api/file/edited', {
                headers: { Authorization: token }
            });
            setEditedVideos(response.data);
        } catch (e) {
            console.log(e);
            alert("Could not fetch edited videos!");
        } finally {
            setIsLoading(false);
        }
    }

    const downloadRawFile = async (url) => {
        try {
            const req = new Request(url);
            fetch(req).then(() => {
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'rawvideo.mp4');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
        } catch (e) {
            console.log(e);
            alert('Error Downloading the video!');
        }
    };

    const handleFileChange = (e) => {
        console.log("Selecting File ", e.target.files[0]);
        setSelectedFile(e.target.files[0]);
    }

    const handleSubmitVideo = async () => {
        if (!selectedFile) {
            alert('Please select File!');
            return;
        }
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('upload_preset', 'editedvideo');
            const api = 'https://api.cloudinary.com/v1_1/djtrvplmk/video/upload';

            const cloudinaryRes = await axios.post(api, formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            const videoUrl = cloudinaryRes.data.secure_url;
            console.log(videoUrl);
            const apiRes = await axios.post('http://localhost:8000/api/file/save-edited', {
                filename: selectedFile.name,
                filePath: videoUrl
            }, {
                headers: { Authorization: token }
            });
            console.log(apiRes.data);
            fetchEditedVideos();
            alert("Video Uploaded!");
            setSelectedFile(null);
        } catch (e) {
            console.log(e);
            alert("Error uploading video!");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    }

    if (!token) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
            <nav className="bg-gray-800 px-6 md:px-12 py-4 flex justify-between items-center">
                <h1 className="text-white sm:text-2xl lg:text-3xl font-bold">Streamline Studio </h1>
                <div>
                    {youtuberEmail ? (
                        <span className="text-white mr-4">{youtuberEmail}</span>
                    ) : (
                        <button onClick={openModal} className="bg-blue-500 text-white px-3 py-1 md:px-4 md:py-2 rounded mr-2 hover:bg-blue-600 transition duration-300 text-sm md:text-base">
                            Verify Secret Key
                        </button>
                    )}
                    <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 md:px-4 md:py-2 rounded hover:bg-red-600 transition duration-300 text-sm md:text-base">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="mt-8 px-4 md:px-12 py-4 mx-auto">
                <div className="flex mb-4">
                    <button
                        onClick={() => setActiveTab('download')}
                        className={`mr-2 px-4 py-2 rounded transition duration-300 ${activeTab === 'download' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white hover:bg-blue-400'}`}
                    >
                        Download Raw File
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`px-4 py-2 rounded transition duration-300 ${activeTab === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white hover:bg-blue-400'}`}
                    >
                        Upload Edited File
                    </button>
                </div>

                {activeTab === 'download' && (
                    <div className="bg-gray-800 p-6 rounded shadow-md">
                        <h2 className="text-xl font-bold mb-4 text-white">Download Raw File</h2>

                        {isLoading ? (
                            <p className="text-white">Loading videos...</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                                {rawVideos.map((video, index) => (
                                    <div key={index} className="bg-gray-700 p-4 rounded">
                                        <video
                                            controls muted
                                            className="w-full h-48 object-cover"
                                            src={video.filePath}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                        <p className="mt-2 text-white">{video.filename}</p>
                                        <p className="text-sm text-gray-400">
                                            Uploaded: {new Date(video.uploadedAt).toLocaleDateString()}
                                        </p>
                                        <button
                                            onClick={() => downloadRawFile(video.filepath)}
                                            className="bg-green-500 text-white px-4 py-2 rounded mt-2 hover:bg-green-600 transition duration-300 w-full"
                                        >
                                            Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'upload' && (
                    <div className="bg-gray-800 p-6 rounded shadow-md">
                        <h2 className="text-xl font-bold mb-4 text-white">Upload Edited File</h2>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-500 file:text-white
                                hover:file:bg-blue-600 transition duration-300"
                        />
                        <button
                            onClick={handleSubmitVideo}
                            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300 w-full sm:w-auto"
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Submit Video'}
                        </button>
                        {isUploading && (
                            <div className="mt-4">
                                <div className="bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${uploadProgress}%`}}></div>
                                </div>
                                <p className="text-white mt-2">{uploadProgress}% Uploaded</p>
                            </div>
                        )}

                        {isLoading ? (
                            <p className="text-white mt-4">Loading videos...</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-10">
                                {editedVideos.map((video, index) => (
                                    <div key={index} className="bg-gray-700 p-4 rounded">
                                        <video
                                            controls muted
                                            className="w-full h-48 object-cover"
                                            src={video.filePath}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                        <p className="mt-2 text-white">{video.filename}</p>
                                        <p className="text-sm text-gray-400">
                                            Uploaded: {new Date(video.uploadedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                contentLabel="Verify Secret Key"
                ariaHideApp={false}
                style={{
                    content: {
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        right: 'auto',
                        bottom: 'auto',
                        marginRight: '-50%',
                        transform: 'translate(-50%, -50%)',
                        background: '#1F2937',
                        padding: '20px',
                        borderRadius: '10px',
                        outline: 'none',
                        maxWidth: '90%',
                        width: '400px'
                    },
                    overlay: {
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)'
                    }
                }}>
                <h2 className="text-2xl mb-4 text-white">Enter YouTuber's Email and Secret Key</h2>
                <input
                    type="email"
                    value={youtuberEmailInput}
                    onChange={handleYoutuberEmailChange}
                    placeholder="YouTuber's Email"
                    className="w-full p-2 border border-gray-700 rounded mb-4 bg-gray-700 text-white"/>
                <div className="relative flex items-center">
                    <input
                        type={showSecretKey ? "text" : "password"}
                        value={secretKey}
                        onChange={handleSecretKeyChange}
                        placeholder="Secret Key"
                        className="w-full p-2 border border-gray-700 rounded mb-4 bg-gray-700 text-white"
                    />
                    <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="absolute right-3 top-3 text-gray-400"
                    >
                        {showSecretKey ? <BiSolidHide /> : <BiSolidShow />}
                    </button>
                </div>
                <div className="flex justify-between">
                    <button
                        onClick={validateSecretKey}
                        className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isLoading}>
                        {isLoading ? 'Validating...' : 'Validate'}
                    </button>
                    <button
                        onClick={closeModal}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300">
                        Cancel
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default EditorHome;