import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, CardActions, Button, Typography, TextField, MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Skeleton } from '@mui/material';
import { Add, Remove, AddShoppingCart, FavoriteBorder } from '@mui/icons-material';
import { getItems, getCategories } from '../services/productService';
import { getItemImages } from '../services/imageService';
import axios from 'axios';
import { toast } from 'react-toastify';

// Utility function to clean empty parameters
const cleanParams = (params: any) => {
  const cleaned = { ...params };
  for (const key in cleaned) {
    if (cleaned[key] === '' || cleaned[key] === undefined || cleaned[key] === null) {
      delete cleaned[key];
    }
    if (key === 'fromPriceRange' || key === 'toPriceRange') {
      cleaned[key] = cleaned[key] ? Number(cleaned[key]) : undefined;
      if (cleaned[key] === undefined || isNaN(cleaned[key])) delete cleaned[key];
    }
  }
  return cleaned;
};

interface Item {
  id: string;
  name: string;
  unitPrice: number;
  details: string;
  category: string;
  quantity?: number;
  imageUrl?: string;
}

const Home: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    fromPriceRange: '',
    toPriceRange: '',
    name: '',
    'sort-by': 'name',
    direction: 'asc',
  });
  const [inputFilters, setInputFilters] = useState({
    category: '',
    fromPriceRange: '',
    toPriceRange: '',
    name: '',
    'sort-by': 'name',
    direction: 'asc',
  });
  const [openLoginDialog, setOpenLoginDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
        toast.success('Categories loaded successfully');
      } catch (error: any) {
        toast.error(error.response?.data?.errorMsg || 'Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = {
          ...filters,
          page: currentPage - 1,
          size: pageSize,
        };
        const cleanedParams = cleanParams(params);
        const itemsResponse = await getItems(cleanedParams);
        const itemIds = itemsResponse.items.map((item: Item) => item.id);
        let itemsWithImages = itemsResponse.items.map(item => ({
          ...item,
          quantity: 1,
          imageUrl: undefined, // Default to undefined, will be updated below
        }));

        if (itemIds.length > 0) {
          const images = await getItemImages(itemIds);
          const imageMap = images.reduce((acc: { [key: string]: string }, img: { itemId: string; location: string }) => {
            acc[img.itemId] = img.location;
            return acc;
          }, {});
          itemsWithImages = itemsWithImages.map(item => ({
            ...item,
            imageUrl: imageMap[item.id] || 'https://via.placeholder.com/150?text=Image+Not+Available',
          }));
        } else {
          // If no items or images, use placeholder for all
          itemsWithImages = itemsWithImages.map(item => ({
            ...item,
            imageUrl: 'https://via.placeholder.com/150?text=Image+Not+Available',
          }));
        }

        setItems(itemsWithImages);
        setTotalPages(itemsResponse.totalPages);
        toast.success('Items loaded successfully');
      } catch (error: any) {
        if (error.response?.status === 404) {
          setItems([]);
          setTotalPages(0);
          toast.error('No items available for the selected filters');
        } else {
          toast.error('Failed to load items');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentPage, filters, pageSize]);

  const handleQuantityChange = (id: string, delta: number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) } : item
    ));
  };

  const handleAddToCart = async (id: string) => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      setOpenLoginDialog(true);
      return;
    }
    const item = items.find(i => i.id === id);
    if (!item) return;
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.post(`${baseUrl}/cart/items`, {
        itemId: item.id,
        itemName: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity || 1,
      }, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 201) toast.success(`Added ${item.name} to cart`);
    } catch (error: any) {
      toast.error(error.response?.data?.errorMsg || 'Failed to add to cart');
    }
  };

  const handleAddToWishlist = async (itemId: string, itemName: string, unitPrice: number) => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      setOpenLoginDialog(true);
      return;
    }
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.post(`${baseUrl}/wishlist/items`, {
        itemId,
        itemName,
        unitPrice,
      }, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 201) toast.success(`Added ${itemName} to wishlist`);
    } catch (error: any) {
      toast.error(error.response?.data?.errorMsg || 'Failed to add to wishlist');
    }
  };

  const handleInputChange = (event: React.ChangeEvent<{ name?: string; value: string }>) => {
    const { name, value } = event.target;
    setInputFilters(prev => ({ ...prev, [name || '']: value }));
  };

  const handleApplyFilters = () => {
    setFilters(inputFilters);
    setCurrentPage(1);
  };

  const handleRemoveFilters = () => {
    setFilters({ category: '', fromPriceRange: '', toPriceRange: '', name: '', 'sort-by': 'name', direction: 'asc' });
    setInputFilters({ category: '', fromPriceRange: '', toPriceRange: '', name: '', 'sort-by': 'name', direction: 'asc' });
    setCurrentPage(1);
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);

  const handleCloseLoginDialog = () => setOpenLoginDialog(false);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Shop Items</Typography>
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Category</InputLabel>
          <Select name="category" value={inputFilters.category} onChange={handleInputChange} label="Category">
            <MenuItem value="">All</MenuItem>
            {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField name="fromPriceRange" label="From Price" type="number" value={inputFilters.fromPriceRange} onChange={handleInputChange} />
        <TextField name="toPriceRange" label="To Price" type="number" value={inputFilters.toPriceRange} onChange={handleInputChange} />
        <TextField name="name" label="Search by Name" value={inputFilters.name} onChange={handleInputChange} />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Sort By</InputLabel>
          <Select name="sort-by" value={inputFilters['sort-by']} onChange={handleInputChange} label="Sort By">
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="unitPrice">Price</MenuItem>
            <MenuItem value="category">Category</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Direction</InputLabel>
          <Select name="direction" value={inputFilters.direction} onChange={handleInputChange} label="Direction">
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleApplyFilters} sx={{ mt: 1 }}>Apply Filter</Button>
        <Button variant="outlined" onClick={handleRemoveFilters} sx={{ mt: 1 }}>Remove Filters</Button>
      </Box>
      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: pageSize }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Skeleton variant="rectangular" width="100%" height={150} />
                  <Skeleton variant="text" sx={{ fontSize: '1.5rem', mt: 1 }} />
                  <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                  <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                  <Skeleton variant="text" sx={{ fontSize: '0.875rem' }} />
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
      ) : items.length > 0 ? (
        <>
          <Grid container spacing={2}>
            {items.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ width: '100%', height: 150, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                      <img
                        src={item.imageUrl || 'https://via.placeholder.com/150?text=Image+Not+Available'}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                    <Typography variant="h6" sx={{ mt: 1 }}>{item.name}</Typography>
                    <Typography color="text.secondary">${item.unitPrice.toFixed(2)}</Typography>
                    <Typography variant="body2">{item.details}</Typography>
                    <Typography variant="caption">Category: {item.category}</Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Button size="small" onClick={() => handleQuantityChange(item.id, -1)}><Remove /></Button>
                      <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                      <Button size="small" onClick={() => handleQuantityChange(item.id, 1)}><Add /></Button>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between' }}>
                    <Button size="small" startIcon={<AddShoppingCart />} onClick={() => handleAddToCart(item.id)}>Add to Cart</Button>
                    <Button size="small" startIcon={<FavoriteBorder />} onClick={() => handleAddToWishlist(item.id, item.name, item.unitPrice)}>Wishlist</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>Page {currentPage} of {totalPages}</Typography>
            <Box>
              <Button onClick={goToFirstPage} disabled={currentPage === 1}>First</Button>
              <Button onClick={goToNextPage} disabled={currentPage === totalPages}>Next</Button>
              <Button onClick={goToLastPage} disabled={currentPage === totalPages}>Last</Button>
            </Box>
          </Box>
        </>
      ) : (
        <Typography sx={{ mb: 2 }}>No items available.</Typography>
      )}
      <Dialog open={openLoginDialog} onClose={handleCloseLoginDialog}>
        <DialogTitle>Login Required</DialogTitle>
        <DialogContent>
          <DialogContentText>Please log in to add items to your wishlist or cart.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLoginDialog} color="primary">OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;