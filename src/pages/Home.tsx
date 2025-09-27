import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, CardActions, Button, Typography, TextField, MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Snackbar } from '@mui/material';
import { Add, Remove, AddShoppingCart, FavoriteBorder } from '@mui/icons-material';
import { getItems, getCategories } from '../services/productService';
import axios from 'axios';

// Utility function to clean empty parameters
const cleanParams = (params: any) => {
  const cleaned = { ...params };
  for (const key in cleaned) {
    if (cleaned[key] === '' || cleaned[key] === undefined || cleaned[key] === null) {
      delete cleaned[key];
    }
    // Convert numeric strings to numbers for price range if they exist
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
  imageUrl?: string; // Optional image URL, will be undefined for now
}

const Home: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Configurable page size
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
  const [openLoginDialog, setOpenLoginDialog] = useState(false); // For login popup
  const [snackbarOpen, setSnackbarOpen] = useState(false); // For all API notifications
  const [snackbarMessage, setSnackbarMessage] = useState(''); // Message for Snackbar
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success'); // Type of message

  // Fetch categories only once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
        setSnackbarMessage('Categories loaded successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error: any) {
        setSnackbarMessage(error.message || 'Failed to load categories');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };
    fetchCategories();
  }, []);

  // Fetch items when page, filters, or page size changes
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const params = {
          ...filters,
          page: currentPage - 1, // API uses 0-based indexing
          size: pageSize,
        };
        const cleanedParams = cleanParams(params); // Clean empty parameters
        const data = await getItems(cleanedParams);
        const itemsWithoutImages = data.items.map((item: Item) => ({ ...item, quantity: 1 })); // No image fetch
        setItems(itemsWithoutImages);
        setTotalPages(data.totalPages);
        setSnackbarMessage('Items loaded successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error: any) {
        setSnackbarMessage(error.message || 'Failed to load items');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };
    fetchItems();
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
      const response = await axios.post(
        `${baseUrl}/cart/items`,
        {
          itemId: item.id,
          itemName: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity || 1,
        },
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      if (response.status === 201) {
        setSnackbarMessage(`Added ${item.name} to cart`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to add to cart' };
      setSnackbarMessage(errorData.errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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
      const response = await axios.post(
        `${baseUrl}/wishlist/items`,
        {
          itemId,
          itemName,
          unitPrice,
        },
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      if (response.status === 201) {
        setSnackbarMessage(`Added ${itemName} to wishlist`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to add to wishlist' };
      setSnackbarMessage(errorData.errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle input changes without triggering API immediately
  const handleInputChange = (event: React.ChangeEvent<{ name?: string; value: string }> | React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = 'target' in event
      ? { name: event.target.name, value: event.target.value }
      : { name: (event as any).target.name, value: (event as any).target.value as string };
    setInputFilters(prev => ({ ...prev, [name || '']: value }));
  };

  // Apply filters and trigger API call
  const handleApplyFilters = () => {
    setFilters(inputFilters);
    setCurrentPage(1); // Reset to first page on filter apply
  };

  // Remove all filters and reset to default
  const handleRemoveFilters = () => {
    setFilters({
      category: '',
      fromPriceRange: '',
      toPriceRange: '',
      name: '',
      'sort-by': 'name',
      direction: 'asc',
    });
    setInputFilters({
      category: '',
      fromPriceRange: '',
      toPriceRange: '',
      name: '',
      'sort-by': 'name',
      direction: 'asc',
    });
    setCurrentPage(1); // Reset to first page
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);

  const handleCloseLoginDialog = () => {
    setOpenLoginDialog(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Shop Items</Typography>
      <Box sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 120, mr: 2 }}>
          <InputLabel>Category</InputLabel>
          <Select
            name="category"
            value={inputFilters.category}
            onChange={handleInputChange}
            label="Category"
          >
            <MenuItem value="">All</MenuItem>
            {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          name="fromPriceRange"
          label="From Price"
          type="number"
          value={inputFilters.fromPriceRange}
          onChange={handleInputChange}
          sx={{ mr: 2 }}
        />
        <TextField
          name="toPriceRange"
          label="To Price"
          type="number"
          value={inputFilters.toPriceRange}
          onChange={handleInputChange}
          sx={{ mr: 2 }}
        />
        <TextField
          name="name"
          label="Search by Name"
          value={inputFilters.name}
          onChange={handleInputChange}
          sx={{ mr: 2 }}
        />
        <FormControl sx={{ minWidth: 120, mr: 2 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            name="sort-by"
            value={inputFilters['sort-by']}
            onChange={handleInputChange}
            label="Sort By"
          >
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="unitPrice">Price</MenuItem>
            <MenuItem value="category">Category</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120, mr: 2 }}>
          <InputLabel>Direction</InputLabel>
          <Select
            name="direction"
            value={inputFilters.direction}
            onChange={handleInputChange}
            label="Direction"
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleApplyFilters} sx={{ mt: 1, mr: 1 }}>Apply Filter</Button>
        <Button variant="outlined" onClick={handleRemoveFilters} sx={{ mt: 1 }}>Remove Filters</Button>
      </Box>
      {items.length > 0 ? (
        <>
          <Grid container spacing={2}>
            {items.map(item => (
              <Grid item={true} xs={12} sm={6} md={4} key={item.id}>
                <Card>
                  <CardContent>
                    <img src={undefined} alt={item.name} style={{ maxWidth: '100%', height: 'auto' }} /> {/* Broken image placeholder */}
                    <Typography variant="h6">{item.name}</Typography>
                    <Typography color="text.secondary">${item.unitPrice.toFixed(2)}</Typography>
                    <Typography variant="body2">{item.details}</Typography>
                    <Typography variant="caption">Category: {item.category}</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Button size="small" onClick={() => handleQuantityChange(item.id, -1)}><Remove /></Button>
                      <Typography component="span" sx={{ mx: 1 }}>{item.quantity}</Typography>
                      <Button size="small" onClick={() => handleQuantityChange(item.id, 1)}><Add /></Button>
                    </Box>
                  </CardContent>
                  <CardActions>
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
          <DialogContentText>
            Please log in to add items to your wishlist or cart.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLoginDialog} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        severity={snackbarSeverity}
      />
    </Box>
  );
};

export default Home;