import React, { useState, useContext } from 'react';
import { Box, Button, TextField, Typography, Link } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { login as loginApi } from '../services/authService';

const schema = yup.object({
  username: yup.string().required(),
  password: yup.string().required(),
}).required();

const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [usernameForForgot, setUsernameForForgot] = useState('');

  const onSubmit = async (data: any) => {
    try {
      const { token } = await loginApi(data);
      auth?.login(token);
      navigate('/');
    } catch {} // Errors handled in interceptor
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5">Login</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField label="Username" {...register('username')} error={!!errors.username} helperText={errors.username?.message} fullWidth margin="normal" onChange={(e) => setUsernameForForgot(e.target.value)} />
        <TextField label="Password" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} fullWidth margin="normal" />
        <Button type="submit" variant="contained" fullWidth>Login</Button>
      </form>
      <Link href="/signup">Sign Up</Link> | <Link href={`/forgot-password?username=${usernameForForgot}`}>Forgot Password</Link>
    </Box>
  );
};

export default Login;