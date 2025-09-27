import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, CardActions, Button, Typography } from '@mui/material';
import { AddShoppingCart, Delete, Add, Remove } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

interface WishlistItem {
  itemId: string;
  itemName: string;
  unitPrice: number;
}

const Wishlist: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const navigate = useNavigate();

  // State to manage quantities for each item
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchWishlistItems();
  }, []);

  const fetchWishlistItems = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.get(
        `${baseUrl}/wishlist/items`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 200) {
        setWishlistItems(response.data);
        // Initialize quantities to 1 for new items
        const initialQuantities = response.data.reduce((acc: { [key: string]: number }, item: WishlistItem) => {
          acc[item.itemId] = 1;
          return acc;
        }, {});
        setQuantities(initialQuantities);
        toast.success('Wishlist loaded successfully');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to load wishlist' };
      toast.error(errorData.errorMsg);
    }
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + delta)
    }));
  };

  const handleRemoveWishlistItem = async (itemId: string) => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.delete(
        `${baseUrl}/wishlist/items?itemId=${itemId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 204) {
        setWishlistItems(wishlistItems.filter(item => item.itemId !== itemId));
        const newQuantities = { ...quantities };
        delete newQuantities[itemId];
        setQuantities(newQuantities);
        toast.success('Item removed from wishlist');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to remove item' };
      toast.error(errorData.errorMsg);
    }
  };

  const handleClearWishlist = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.delete(
        `${baseUrl}/wishlist/items`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 204) {
        setWishlistItems([]);
        setQuantities({});
        toast.success('Wishlist cleared successfully');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to clear wishlist' };
      toast.error(errorData.errorMsg);
    }
  };

  const handleAddToCart = async (itemId: string, itemName: string, unitPrice: number) => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    const quantity = quantities[itemId] || 1;
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.post(
        `${baseUrl}/cart/items`,
        {
          itemId,
          itemName,
          unitPrice,
          quantity,
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 201) {
        toast.success(`Added ${itemName} to cart (Quantity: ${quantity})`);
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to add to cart' };
      toast.error(errorData.errorMsg);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Wishlist</Typography>
      {wishlistItems.length > 0 ? (
        <>
          <Grid container spacing={2}>
            {wishlistItems.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.itemId}>
                <Card>
                  <CardContent>
                    <img src={undefined} alt={item.itemName} style={{ maxWidth: '100%', height: 'auto' }} />
                    <Typography variant="h6">{item.itemName}</Typography>
                    <Typography color="text.secondary">${item.unitPrice.toFixed(2)}</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Button size="small" onClick={() => handleQuantityChange(item.itemId, -1)}><Remove /></Button>
                      <Typography component="span" sx={{ mx: 1 }}>{quantities[item.itemId] || 1}</Typography>
                      <Button size="small" onClick={() => handleQuantityChange(item.itemId, 1)}><Add /></Button>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<AddShoppingCart />} onClick={() => handleAddToCart(item.itemId, item.itemName, item.unitPrice)}>Add to Cart</Button>
                    <Button size="small" startIcon={<Delete />} onClick={() => handleRemoveWishlistItem(item.itemId)}>Remove</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="error" onClick={handleClearWishlist}>Clear Wishlist</Button>
          </Box>
        </>
      ) : (
        <Typography sx={{ mb: 2 }}>Your wishlist is empty.</Typography>
      )}
    </Box>
  );
};

export default Wishlist;