import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, CardActions, Button, Typography, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';
import { AddShoppingCart, Delete, Add, Remove } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getItemImages } from '../services/imageService'; // Import image service

interface WishlistItem {
  itemId: string;
  itemName: string;
  unitPrice: number;
  imageUrl?: string; // Add imageUrl to the interface
}

const Wishlist: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const navigate = useNavigate();
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [openLoginDialog, setOpenLoginDialog] = useState(false); // Added to manage dialog state

  useEffect(() => {
    fetchWishlistItems();
  }, []);

  const fetchWishlistItems = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('jwt');
    if (!token) {
      setIsLoading(false);
      setOpenLoginDialog(true); // Open dialog if no token
      return;
    }

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.get(`${baseUrl}/wishlist/items`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 200) {
        const items = response.data;
        const itemIds = items.map((item: WishlistItem) => item.itemId);
        let itemsWithImages = items.map(item => ({ ...item, imageUrl: undefined }));

        if (itemIds.length > 0) {
          const images = await getItemImages(itemIds); // No Authorization header
          const imageMap = images.reduce((acc: { [key: string]: string }, img: { itemId: string; location: string }) => {
            acc[img.itemId] = img.location;
            return acc;
          }, {});
          itemsWithImages = itemsWithImages.map(item => ({
            ...item,
            imageUrl: imageMap[item.itemId] || 'https://via.placeholder.com/150?text=Image+Not+Available',
          }));
        } else {
          itemsWithImages = itemsWithImages.map(item => ({
            ...item,
            imageUrl: 'https://via.placeholder.com/150?text=Image+Not+Available',
          }));
        }

        setWishlistItems(itemsWithImages);
        const initialQuantities = itemsWithImages.reduce((acc: { [key: string]: number }, item: WishlistItem) => {
          acc[item.itemId] = 1;
          return acc;
        }, {});
        setQuantities(initialQuantities);
        toast.success('Wishlist loaded successfully');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to load wishlist' };
      toast.error(errorData.errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + delta),
    }));
  };

  const handleRemoveWishlistItem = async (itemId: string) => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.delete(`${baseUrl}/wishlist/items?itemId=${itemId}`, { headers: { 'Authorization': `Bearer ${token}` } });
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
      const response = await axios.delete(`${baseUrl}/wishlist/items`, { headers: { 'Authorization': `Bearer ${token}` } });
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
    if (!token) {
      setOpenLoginDialog(true); // Open dialog if no token
      return;
    }

    const quantity = quantities[itemId] || 1;
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.post(`${baseUrl}/cart/items`, {
        itemId,
        itemName,
        unitPrice,
        quantity,
      }, { headers: { 'Authorization': `Bearer ${token}` } });
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
      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Skeleton variant="rectangular" width="100%" height={150} />
                  <Skeleton variant="text" sx={{ fontSize: '1.5rem', mt: 1 }} />
                  <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <Skeleton variant="rectangular" width={40} height={40} />
                    <Skeleton variant="text" sx={{ mx: 1, width: 20 }} />
                    <Skeleton variant="rectangular" width={40} height={40} />
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Skeleton variant="rectangular" width={100} height={36} />
                  <Skeleton variant="rectangular" width={100} height={36} />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : wishlistItems.length > 0 ? (
        <>
          <Grid container spacing={2}>
            {wishlistItems.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.itemId}>
                <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ width: '100%', height: 150, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                      <img
                        src={item.imageUrl || 'https://via.placeholder.com/150?text=Image+Not+Available'}
                        alt={item.itemName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                    <Typography variant="h6" sx={{ mt: 1 }}>{item.itemName}</Typography>
                    <Typography color="text.secondary">${item.unitPrice.toFixed(2)}</Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Button size="small" onClick={() => handleQuantityChange(item.itemId, -1)}><Remove /></Button>
                      <Typography sx={{ mx: 1 }}>{quantities[item.itemId] || 1}</Typography>
                      <Button size="small" onClick={() => handleQuantityChange(item.itemId, 1)}><Add /></Button>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between' }}>
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
      <Dialog open={openLoginDialog} onClose={() => setOpenLoginDialog(false)}>
        <DialogTitle>Login Required</DialogTitle>
        <DialogContent>
          <DialogContentText>Please log in to manage your wishlist.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLoginDialog(false)} color="primary">OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Wishlist;