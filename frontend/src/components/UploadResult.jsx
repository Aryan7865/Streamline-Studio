import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const UploadResult = () => {
    const [uploadStatus, setUploadStatus] = useState({ success: false, message: '' });
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const success = searchParams.get('success') === 'true';
        const videoId = searchParams.get('videoId');
        const error = searchParams.get('error');

        if (success) {
            setUploadStatus({
                success: true,
                message: `Video (ID: ${videoId}) was successfully uploaded to YouTube!`
            });
        } else {
            setUploadStatus({
                success: false,
                message: `Upload failed. Error: ${error || 'Unknown error occurred'}`
            });
        }
    }, [location]);

    const handleGoBack = () => {
        navigate('/youtuber-home');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white shadow-md rounded-lg">
                <h2 className={`text-2xl font-bold mb-4 ${uploadStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                    {uploadStatus.success ? 'Upload Successful!' : 'Upload Failed'}
                </h2>
                <p className="text-gray-700 mb-6">{uploadStatus.message}</p>
                <button
                    onClick={handleGoBack}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default UploadResult;