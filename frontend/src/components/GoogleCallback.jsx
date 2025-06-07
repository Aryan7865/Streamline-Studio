import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const GoogleCallback = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            const searchParams = new URLSearchParams(location.search);
            const code = searchParams.get('code');
            const state = searchParams.get('state'); // This is your videoId

            if (code) {
                try {
                    await axios.get(`http://localhost:8000/auth/google/callback${location.search}`);
                    // Close this window and notify the opener
                    if (window.opener) {
                        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', videoId: state }, '*');
                        window.close();
                    } else {
                        navigate('/'); // Fallback if opener is not available
                    }
                } catch (error) {
                    console.error('Error in Google callback:', error);
                    // Handle error (maybe show an error message to the user)
                }
            }
        };

        handleCallback();
    }, [location, navigate]);

    return <div>Processing Google authentication...</div>;
};

export default GoogleCallback;