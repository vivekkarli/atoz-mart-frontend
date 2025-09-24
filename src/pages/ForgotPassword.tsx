import React, { useEffect } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSearchParams } from 'react-router-dom';
import { forgotPassword as forgotApi } from '../services/authService';

const schema = yup.object({
  username: yup.string().required(),
}).required();

const ForgotPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    const username = searchParams.get('username');
    if (username) setValue('username', username);
  }, [searchParams, setValue]);

  const onSubmit = async (data: any) => {
    try {
      await forgotApi(data);
      // Toast success if needed, but API msg is for email
    } catch {} // Errors handled
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5">Forgot Password</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField label="Username" {...register('username')} error={!!errors.username} helperText={errors.username?.message} fullWidth margin="normal" />
        <Button type="submit" variant="contained" fullWidth>Send Reset Link</Button>
      </form>
    </Box>
  );
};

export default ForgotPassword;