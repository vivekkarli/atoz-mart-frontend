import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Link } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login } from '../services/authService';
import oauthService from '../services/oauthService';
import { useAuth } from '../contexts/AuthContext';

const schema = yup.object({
  username: yup.string().required(),
  password: yup.string().required(),
}).required();

const Login: React.FC = () => {
  const { login: contextLogin } = useAuth(); // Use context login
  const [usernameForForgot, setUsernameForForgot] = useState('');
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: any) => {
    try {
      const { token } = await login(data);
      if (token) {
        contextLogin(token); // Update AuthContext
        toast.success('Login successful');
        navigate('/');
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      toast.error('Login failed due to an unexpected error');
    }
  };

  const handleOAuthLogin = () => {
    oauthService.initiateAuth('keycloak');
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5">Login</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField label="Username" {...register('username')} error={!!errors.username} helperText={errors.username?.message} fullWidth margin="normal" onChange={(e) => setUsernameForForgot(e.target.value)} />
        <TextField label="Password" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} fullWidth margin="normal" />
        <Button type="submit" variant="contained" fullWidth sx={{ mb: 2 }}>
          Login
        </Button>
      </form>
      <Button variant="outlined" fullWidth onClick={handleOAuthLogin} sx={{ mb: 2 }}>
        Sign in with Keycloak
      </Button>
      <Link href="/signup">Sign Up</Link> | <Link href={`/forgot-password?username=${usernameForForgot}`}>Forgot Password</Link>
    </Box>
  );
};

export default Login;