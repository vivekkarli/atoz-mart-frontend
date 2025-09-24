import React from 'react';
import { Typography, Container } from '@mui/material';

const Home: React.FC = () => {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Welcome to AtoZ Mart</Typography>
      <Typography>This is the home page. Grocery features will be added later.</Typography>
    </Container>
  );
};

export default Home;