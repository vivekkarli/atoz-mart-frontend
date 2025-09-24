import React from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { resetPassword } from '../services/authService'; // Import the resetPassword function

const schema = yup.object({
  newPassword: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'Passwords must match').required('Confirm password is required'),
}).required();

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const token = searchParams.get('token');

  const onSubmit = async (data: any) => {
    console.log('Form submitted', { token, data }); // Debug log
    if (!token) {
      toast.error('Invalid reset link');
      return;
    }

    try {
      await resetPassword({ token, newPassword: data.newPassword }); // API call
      toast.success('Password reset successful');
      navigate('/login'); // Redirect after success
    } catch (error) {
      toast.error('Failed to reset password. Please try again.');
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5">Reset Password</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="New Password"
          type="password"
          {...register('newPassword')}
          error={!!errors.newPassword}
          helperText={errors.newPassword?.message}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Confirm Password"
          type="password"
          {...register('confirmPassword')}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" fullWidth>
          Reset
        </Button>
      </form>
    </Box>
  );
};

export default ResetPassword;