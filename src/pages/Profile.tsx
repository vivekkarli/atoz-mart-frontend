import React from 'react';
import { Typography, Container } from '@mui/material';

const Profile: React.FC = () => {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Your Profile</Typography>
      <Typography>This feature is under development and will be available soon.</Typography>
    </Container>
  );
};

export default Profile;