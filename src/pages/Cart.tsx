import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, CardActions, Button, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { AddShoppingCart, Delete, Add, Remove } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

interface CartItem {
  itemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  effectivePrice: number;
}

interface Coupon {
  couponCode: string;
  discount: number;
}

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderAmount, setOrderAmount] = useState(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
    fetchCoupons();
  }, []);

  const fetchCartItems = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.get(
        `${baseUrl}/cart/items`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 200) {
        const data = response.data;
        setCartItems(data.items);
        setOrderAmount(data.orderAmount);
        const initialQuantities = data.items.reduce((acc: { [key: string]: number }, item: CartItem) => {
          acc[item.itemId] = item.quantity;
          return acc;
        }, {});
        setQuantities(initialQuantities);
        toast.success('Cart loaded successfully');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to load cart' };
      toast.error(errorData.errorMsg);
    }
  };

  const fetchCoupons = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.get(
        `${baseUrl}/cart/coupon`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 200) {
        setCoupons(response.data);
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to load coupons' };
      toast.error(errorData.errorMsg);
    }
  };

  const handleQuantityChange = async (itemId: string, delta: number) => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    const newQuantity = Math.max(1, (quantities[itemId] || 1) + delta);
    setQuantities(prev => ({ ...prev, [itemId]: newQuantity }));

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.patch(
        `${baseUrl}/cart/items/quantity`,
        { itemId, quantity: newQuantity },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 200) {
        fetchCartItems();
        toast.success(`Quantity updated for ${cartItems.find(item => item.itemId === itemId)?.itemName}`);
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to update quantity' };
      toast.error(errorData.errorMsg);
      setQuantities(prev => ({ ...prev, [itemId]: quantities[itemId] || 1 }));
    }
  };

  const handleRemoveCartItem = async (itemId: string) => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.delete(
        `${baseUrl}/cart/items?itemId=${itemId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 204) {
        setCartItems(cartItems.filter(item => item.itemId !== itemId));
        const newQuantities = { ...quantities };
        delete newQuantities[itemId];
        setQuantities(newQuantities);
        fetchCartItems();
        toast.success('Item removed from cart');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to remove item' };
      toast.error(errorData.errorMsg);
    }
  };

  const handleEmptyCart = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.delete(
        `${baseUrl}/cart/items`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 204) {
        setCartItems([]);
        setQuantities({});
        setOrderAmount(0);
        setSelectedCoupon('');
        toast.success('Cart emptied successfully');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to empty cart' };
      toast.error(errorData.errorMsg);
    }
  };

  const handleCouponChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedCoupon(event.target.value as string);
  };

  const calculateSavings = () => {
    if (!selectedCoupon || !coupons.length) return 0;
    const coupon = coupons.find(c => c.couponCode === selectedCoupon);
    if (!coupon) return 0;
    const savings = (orderAmount * coupon.discount) / 100;
    return savings;
  };

  const deliveryCharges = 0;
  const orderSavings = calculateSavings();
  const orderTotal = orderAmount - orderSavings;

useEffect(() => {
  localStorage.setItem('cartOrderTotal', orderTotal.toString());
  localStorage.setItem('cartCouponCode', selectedCoupon);
  localStorage.setItem('cartOrderSavings', orderSavings.toString());
}, [orderTotal, selectedCoupon, orderSavings]);

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <Box sx={{ p: 2, position: 'relative', minHeight: '80vh' }}>
      <Typography variant="h4" gutterBottom>Cart</Typography>
      {cartItems.length > 0 ? (
        <>
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            <Button variant="contained" color="error" onClick={handleEmptyCart}>Empty Cart</Button>
          </Box>
          <Grid container spacing={2}>
            {cartItems.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.itemId}>
                <Card>
                  <CardContent>
                    <img src={undefined} alt={item.itemName} style={{ maxWidth: '100%', height: 'auto' }} />
                    <Typography variant="h6">{item.itemName}</Typography>
                    <Typography color="text.secondary">${item.unitPrice.toFixed(2)} x {item.quantity} = ${item.effectivePrice.toFixed(2)}</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Button size="small" onClick={() => handleQuantityChange(item.itemId, -1)}><Remove /></Button>
                      <Typography component="span" sx={{ mx: 1 }}>{quantities[item.itemId] || item.quantity}</Typography>
                      <Button size="small" onClick={() => handleQuantityChange(item.itemId, 1)}><Add /></Button>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<Delete />} onClick={() => handleRemoveCartItem(item.itemId)}>Remove</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 2 }}>
            <FormControl sx={{ minWidth: 120, mr: 2 }}>
              <InputLabel>Coupon Code</InputLabel>
              <Select value={selectedCoupon} onChange={handleCouponChange} label="Coupon Code">
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {coupons.map(coupon => (
                  <MenuItem key={coupon.couponCode} value={coupon.couponCode}>
                    {coupon.couponCode} ({coupon.discount}%)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
            <Typography variant="h6">Billing Information</Typography>
            <Typography>Order Amount: ${orderAmount.toFixed(2)}</Typography>
            <Typography>Coupon Code: {selectedCoupon || 'None'}</Typography>
            <Typography>Order Savings: ${orderSavings.toFixed(2)}</Typography>
            <Typography>Delivery Charges: ${deliveryCharges.toFixed(2)}</Typography>
            <Typography variant="h6">Order Total: ${orderTotal.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
            <Button variant="contained" color="primary" onClick={handleCheckout}>Checkout</Button>
          </Box>
        </>
      ) : (
        <Typography sx={{ mb: 2 }}>Your cart is empty.</Typography>
      )}
    </Box>
  );
};

export default Cart;