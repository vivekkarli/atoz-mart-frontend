import React from 'react';
import { Typography, Container } from '@mui/material';

const Wishlist: React.FC = () => {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Your Wishlist</Typography>
      <Typography>This feature is under development and will be available soon.</Typography>
    </Container>
  );
};

export default Wishlist;