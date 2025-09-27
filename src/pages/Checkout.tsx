import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Address {
  addressType: string;
  addressDesc: string | null;
  defaultAddress: boolean;
  addLine1: string;
  addLine2: string;
  addLine3: string;
  pincode: string;
  country: string;
}

interface ProfileResponse {
  basicDetails: {
    username: string;
    firstName: string;
    lastName: string;
    mail: string;
    mobileNo: string;
  };
  addressDetails: Address[];
}

const Checkout: React.FC = () => {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('COD');
  const [orderTotal, setOrderTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    // Fetch order total from cart (simplified, assumes cart state is accessible)
    const cartOrderTotal = parseFloat(localStorage.getItem('cartOrderTotal') || '0');
    setOrderTotal(cartOrderTotal);
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.get(
        `${baseUrl}/profile/profile`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 200) {
        setProfile(response.data);
        const defaultAddress = response.data.addressDetails.find(a => a.defaultAddress);
        if (defaultAddress) {
          setSelectedAddress(JSON.stringify(defaultAddress));
        }
        toast.success('Profile loaded successfully');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to load profile' };
      toast.error(errorData.errorMsg);
    }
  };

  const handleAddressChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedAddress(event.target.value as string);
  };

  const handlePaymentModeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPaymentMode(event.target.value as string);
  };

  const handleProceedToPayment = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
    const requestBody = {
      orderAmount: orderTotal,
      couponCode: localStorage.getItem('cartCouponCode') || '',
      orderSavings: parseFloat(localStorage.getItem('cartOrderSavings') || '0'),
      orderTotal: orderTotal,
      paymentMode,
    };

    try {
      const response = await axios.post(
        `${baseUrl}/cart/checkout/payment`,
        requestBody,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 201) {
        const { orderId, msg } = response.data;
        toast.success(msg);
        navigate('/');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to place order' };
      toast.error(errorData.errorMsg);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Checkout</Typography>
      {profile ? (
        <>
          <FormControl sx={{ minWidth: 300, mb: 2 }}>
            <InputLabel>Delivery Address</InputLabel>
            <Select value={selectedAddress} onChange={handleAddressChange} label="Delivery Address">
              {profile.addressDetails.map((address, index) => (
                <MenuItem key={index} value={JSON.stringify(address)}>
                  {`${address.addLine1}, ${address.addLine2}, ${address.addLine3}, ${address.pincode}, ${address.country} (${address.addressType}${address.defaultAddress ? ' - Default' : ''})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 300, mb: 2 }}>
            <InputLabel>Payment Mode</InputLabel>
            <Select value={paymentMode} onChange={handlePaymentModeChange} label="Payment Mode">
              <MenuItem value="COD">Cash on Delivery</MenuItem>
              {/* Other payment options to be added later */}
            </Select>
          </FormControl>
          <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
            <Typography variant="h6">Order Summary</Typography>
            <Typography>Order Total: ${orderTotal.toFixed(2)}</Typography>
          </Box>
          {paymentMode === 'COD' ? (
            <Button variant="contained" color="primary" onClick={handleProceedToPayment}>
              Place Order
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={handleProceedToPayment}>
              Proceed to Payment
            </Button>
          )}
        </>
      ) : (
        <Typography>Loading profile...</Typography>
      )}
    </Box>
  );
};

export default Checkout;