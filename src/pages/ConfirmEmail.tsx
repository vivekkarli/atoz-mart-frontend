import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const ConfirmEmail: React.FC = () => {
  const [isConfirmed, setIsConfirmed] = useState<boolean | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [hasCalledAPI, setHasCalledAPI] = useState(false); // Flag to prevent multiple calls

  useEffect(() => {
    if (!token || hasCalledAPI) {
      return; // Exit if no token or already called
    }

    const confirmEmail = async () => {
      console.log('Calling confirm email API with token:', token); // Debug log
      try {
        const baseUrl = 'https://localhost:8072/atozmart/authserver';
        await axios.post(
          `${baseUrl}/confirm-email?token=${encodeURIComponent(token)}`,
          {},
          { headers: {} } // Removed Authorization header
        );
        setIsConfirmed(true);
        toast.success('Email confirmed successfully!');
      } catch (error: any) {
        setIsConfirmed(false);
        const errorMsg = error.response?.data?.errorMsg || 'Failed to confirm email.';
        toast.error(errorMsg);
      } finally {
        setHasCalledAPI(true); // Mark as called regardless of success/failure
      }
    };

    confirmEmail();
  }, [token, hasCalledAPI]); // Include hasCalledAPI to stabilize

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>Confirm Email</Typography>
      {isConfirmed === null ? (
        <Typography>Processing confirmation...</Typography>
      ) : isConfirmed ? (
        <>
          <Typography>Your email has been confirmed successfully!</Typography>
          <Button variant="contained" onClick={handleGoToProfile} sx={{ mt: 2 }}>Go to Profile</Button>
        </>
      ) : (
        <Typography>Something went wrong. Please try again or contact support.</Typography>
      )}
    </Box>
  );
};

export default ConfirmEmail;