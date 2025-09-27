import React, { useContext } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { signup as signupApi } from '../services/authService';

const schema = yup.object({
  username: yup.string().required(),
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  password: yup.string().required().min(8),
  mail: yup.string().email().required(),
  mobileNo: yup.string().required(),
}).required();

const Signup: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    try {
      await signupApi(data);
      navigate('/login'); // Redirect to login after signup
    } catch {} // Errors handled in interceptor
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5">Sign Up</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField label="Username" {...register('username')} error={!!errors.username} helperText={errors.username?.message} fullWidth margin="normal" />
        <TextField label="First Name" {...register('firstName')} error={!!errors.firstName} helperText={errors.firstName?.message} fullWidth margin="normal" />
        <TextField label="Last Name" {...register('lastName')} error={!!errors.lastName} helperText={errors.lastName?.message} fullWidth margin="normal" />
        <TextField label="Password" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} fullWidth margin="normal" />
        <TextField label="Email" {...register('mail')} error={!!errors.mail} helperText={errors.mail?.message} fullWidth margin="normal" />
        <TextField label="Mobile No" {...register('mobileNo')} error={!!errors.mobileNo} helperText={errors.mobileNo?.message} fullWidth margin="normal" />
        <Button type="submit" variant="contained" fullWidth>Sign Up</Button>
      </form>
    </Box>
  );
};

export default Signup;