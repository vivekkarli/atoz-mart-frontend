import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Select, MenuItem, FormControl, InputLabel, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary, AccordionDetails, Card, CardContent, CardMedia, Grid, Stack, Avatar, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getItemImages } from '../services/imageService';

interface BasicDetails {
  username?: string;
  firstName?: string;
  lastName?: string;
  mail?: string;
  mobileNo?: string;
}

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

interface OrderSummary {
  orderId: number;
  deliveryStatus: string;
  orderedOn: string;
}

interface OrderItem {
  itemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  effectivePrice: number;
  imageUrl?: string;
}

interface OrderDetail {
  orderId: number;
  paymentStatus: string;
  deliveryStatus: string;
  orderStatus: string;
  orderTotal: number;
  orderedOn: string;
  orderItems: OrderItem[] | null;
}

interface ProfileResponse {
  basicDetails: BasicDetails;
  addressDetails: Address[];
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [orderDetails, setOrderDetails] = useState<{ [key: number]: OrderDetail }>({});
  const [editBasicOpen, setEditBasicOpen] = useState(false);
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAddressType, setSelectedAddressType] = useState<string>('');
  const [basicDetails, setBasicDetails] = useState<BasicDetails>({});
  const [addressDetails, setAddressDetails] = useState<Address>({ addressType: '', addressDesc: null, defaultAddress: false, addLine1: '', addLine2: '', addLine3: '', pincode: '', country: '' });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.get(`${baseUrl}/profile/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 200) {
        setProfile(response.data);
        toast.success('Profile loaded successfully');
        await fetchProfilePhoto();
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setProfile(null);
        if (!location.pathname.includes('/create-profile')) {
          navigate('/create-profile');
        }
      } else {
        const errorData = error.response?.data || { errorMsg: 'Failed to load profile' };
        toast.error(errorData.errorMsg);
      }
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const fetchProfilePhoto = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      setIsPhotoLoading(true);
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.get(`${baseUrl}/profile/profile/profile-photo`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
        responseType: 'blob',
      });
      if (response.status === 200) {
        const imageBlob = response.data;
        const imageUrl = URL.createObjectURL(imageBlob);
        setProfilePhotoUrl(imageUrl);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setProfilePhotoUrl(null); // Use default photo
      } else {
        toast.error('Failed to load profile photo');
      }
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const handleUploadProfilePhoto = async () => {
    const token = localStorage.getItem('jwt');
    if (!token || !selectedFile) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(`${baseUrl}/profile/profile/profile-photo`, formData, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      if (response.status === 201) {
        setUploadPhotoOpen(false);
        setSelectedFile(null);
        await fetchProfilePhoto();
        toast.success('Profile photo uploaded successfully');
      }
    } catch (error: any) {
      toast.error('Failed to upload profile photo');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const fetchOrders = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.get(`${baseUrl}/order/orders`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 200) {
        setOrders(response.data.map((order: any) => ({
          orderId: order.orderId,
          deliveryStatus: order.deliveryStatus,
          orderedOn: new Date(order.orderedOn).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        })));
        toast.success('Orders loaded successfully');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to load orders' };
      toast.error(errorData.errorMsg);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.get(`${baseUrl}/order/orders?orderId=${orderId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 200) {
        let detail = {
          ...response.data[0],
          orderedOn: new Date(response.data[0].orderedOn).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        };
        if (detail.orderItems) {
          const itemIds = detail.orderItems.map(item => item.itemId);
          const images = await getItemImages(itemIds); // No authorization token
          const imageMap = images.reduce((acc: { [key: string]: string }, img: { itemId: string; location: string }) => {
            acc[img.itemId] = img.location;
            return acc;
          }, {});
          detail.orderItems = detail.orderItems.map(item => ({
            ...item,
            imageUrl: imageMap[item.itemId] || 'https://via.placeholder.com/50?text=No+Image',
          }));
        }
        setOrderDetails(prev => ({ ...prev, [orderId]: detail }));
        toast.success(`Order ${orderId} details loaded`);
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to load order details' };
      toast.error(errorData.errorMsg);
    }
  };

  const handleEditBasic = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const requestBody = { basicDetails: { firstName: basicDetails.firstName, lastName: basicDetails.lastName, mail: basicDetails.mail, mobileNo: basicDetails.mobileNo }, addressDetails: null };
      const response = await axios.patch(`${baseUrl}/profile/profile`, requestBody, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 200) {
        setEditBasicOpen(false);
        fetchProfile();
        toast.success('Basic details updated successfully');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to update basic details' };
      toast.error(errorData.errorMsg);
    }
  };

  const handleEditAddress = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      let requestBody = { basicDetails: { firstName: profile?.basicDetails.firstName, lastName: profile?.basicDetails.lastName, mail: profile?.basicDetails.mail, mobileNo: profile?.basicDetails.mobileNo }, addressDetails: [addressDetails] };
      const existingAddress = profile?.addressDetails.find(a => a.addressType === addressDetails.addressType && a.addressType !== selectedAddressType);
      if (existingAddress && addressDetails.addressType !== selectedAddressType) {
        requestBody.addressDetails.push({ ...existingAddress, addressType: selectedAddressType, addressDesc: addressDetails.addressDesc });
        addressDetails.addressDesc = existingAddress.addressDesc;
      }
      const response = await axios.patch(`${baseUrl}/profile/profile`, requestBody, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 200) {
        setEditAddressOpen(false);
        fetchProfile();
        toast.success('Address updated successfully');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to update address' };
      toast.error(errorData.errorMsg);
    }
  };

  const handleAddAddress = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const requestBody = { basicDetails: { firstName: profile?.basicDetails.firstName, lastName: profile?.basicDetails.lastName, mail: profile?.basicDetails.mail, mobileNo: profile?.basicDetails.mobileNo }, addressDetails: [{ ...addressDetails, defaultAddress: false }] };
      const response = await axios.patch(`${baseUrl}/profile/profile`, requestBody, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 200) {
        setAddAddressOpen(false);
        fetchProfile();
        toast.success('Address added successfully');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to add address' };
      toast.error(errorData.errorMsg);
    }
  };

  const handleChangeDefaultAddress = async (addressType: string) => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.patch(`${baseUrl}/profile/profile/address?addressType=${addressType}`, {}, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 200) {
        fetchProfile();
        toast.success('Default address updated successfully');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to change default address' };
      toast.error(errorData.errorMsg);
    }
  };

  const handleDeleteAddress = async (addressType: string) => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.delete(`${baseUrl}/profile/profile/address?addressType=${addressType}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 200) {
        fetchProfile();
        toast.success('Address deleted successfully');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to delete address' };
      toast.error(errorData.errorMsg);
    }
  };

  const handleDeleteAllAddresses = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.delete(`${baseUrl}/profile/profile/address`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 200) {
        fetchProfile();
        toast.success('All addresses deleted successfully');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to delete all addresses' };
      toast.error(errorData.errorMsg);
    }
  };

  const handleChangePassword = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const requestBody = { oldPassword, newPassword };
      const response = await axios.patch(`${baseUrl}/authserver/change-password`, requestBody, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 201) {
        setChangePasswordOpen(false);
        setOldPassword('');
        setNewPassword('');
        toast.success('Password changed successfully!');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to change password' };
      toast.error(errorData.errorMsg);
    }
  };

  const isAddAddressDisabled = profile?.addressDetails.length >= 3;
  const existingAddressTypes = profile?.addressDetails.map(a => a.addressType) || [];

  return (
    <Box sx={{ p: 4, bgcolor: '#f9f9f9', minHeight: '100vh' }}>
      <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
        My Profile
      </Typography>
      {profile ? (
        <Grid container spacing={4}>
          {/* Basic Details Section */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
              <CardContent>
                <Stack direction="column" alignItems="center" spacing={2}>
                  {isPhotoLoading ? (
                    <CircularProgress />
                  ) : (
                    <Avatar
                      src={profilePhotoUrl || 'https://via.placeholder.com/150?text=Profile+Photo'}
                      sx={{ width: 120, height: 120, mb: 2 }}
                    />
                  )}
                  <Button
                    variant="outlined"
                    onClick={() => setUploadPhotoOpen(true)}
                  >
                    {profilePhotoUrl ? 'Change Profile Photo' : 'Upload Profile Photo'}
                  </Button>
                </Stack>
                <Typography variant="h5" fontWeight="medium" gutterBottom>
                  Basic Details
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body1"><strong>Username:</strong> {profile.basicDetails.username}</Typography>
                  <Typography variant="body1"><strong>First Name:</strong> {profile.basicDetails.firstName}</Typography>
                  <Typography variant="body1"><strong>Last Name:</strong> {profile.basicDetails.lastName}</Typography>
                  <Typography variant="body1"><strong>Email:</strong> {profile.basicDetails.mail}</Typography>
                  <Typography variant="body1"><strong>Mobile:</strong> {profile.basicDetails.mobileNo}</Typography>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      setBasicDetails({
                        firstName: profile.basicDetails.firstName,
                        lastName: profile.basicDetails.lastName,
                        mail: profile.basicDetails.mail,
                        mobileNo: profile.basicDetails.mobileNo
                      });
                      setEditBasicOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => setChangePasswordOpen(true)}
                  >
                    Change Password
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Address Details Section */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h5" fontWeight="medium" gutterBottom>
                  Address Details
                </Typography>
                {profile.addressDetails.map((address) => (
                  <Box key={address.addressType} sx={{ mb: 2, p: 2, bgcolor: '#fff', borderRadius: 1, boxShadow: 1 }}>
                    <Typography variant="body1">{`${address.addLine1}, ${address.addLine2}, ${address.addLine3}, ${address.pincode}, ${address.country} (${address.addressType}${address.defaultAddress ? ' - Default' : ''})`}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setAddressDetails(address);
                          setEditAddressOpen(true);
                          setSelectedAddressType(address.addressType);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={address.defaultAddress}
                        onClick={() => handleChangeDefaultAddress(address.addressType)}
                      >
                        Set as Default
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => handleDeleteAddress(address.addressType)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Box>
                ))}
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button variant="contained" color="error" onClick={handleDeleteAllAddresses}>
                    Delete All
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={isAddAddressDisabled}
                    onClick={() => setAddAddressOpen(true)}
                  >
                    Add Address
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Order Details Section */}
          <Grid item xs={12}>
            <Card sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h5" fontWeight="medium" gutterBottom>
                  Order History
                </Typography>
                <Accordion onChange={(_, expanded) => { if (expanded && orders.length === 0) fetchOrders(); }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>View Orders</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {orders.map((order) => (
                      <Accordion
                        key={order.orderId}
                        onChange={(_, expanded) => {
                          if (expanded && !orderDetails[order.orderId]) fetchOrderDetails(order.orderId);
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>Order ID: {order.orderId} | Status: {order.deliveryStatus} | Date: {order.orderedOn}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          {orderDetails[order.orderId] && (
                            <Card sx={{ mb: 2 }}>
                              <CardContent>
                                <Typography variant="body1"><strong>Order ID:</strong> {orderDetails[order.orderId].orderId}</Typography>
                                <Typography variant="body1"><strong>Payment Status:</strong> {orderDetails[order.orderId].paymentStatus}</Typography>
                                <Typography variant="body1"><strong>Delivery Status:</strong> {orderDetails[order.orderId].deliveryStatus}</Typography>
                                <Typography variant="body1"><strong>Order Status:</strong> {orderDetails[order.orderId].orderStatus}</Typography>
                                <Typography variant="body1"><strong>Total:</strong> ${orderDetails[order.orderId].orderTotal.toFixed(2)}</Typography>
                                <Typography variant="body1"><strong>Date:</strong> {orderDetails[order.orderId].orderedOn}</Typography>
                                {orderDetails[order.orderId].orderItems && orderDetails[order.orderId].orderItems.length > 0 && (
                                  <Box sx={{ mt: 2 }}>
                                    {orderDetails[order.orderId].orderItems.map((item, index) => (
                                      <Card
                                        key={index}
                                        sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, bgcolor: '#fff', borderRadius: 1, boxShadow: 1 }}
                                      >
                                        <CardMedia
                                          component="img"
                                          height="50"
                                          image={item.imageUrl || 'https://via.placeholder.com/50?text=No+Image'}
                                          alt={item.itemName}
                                          sx={{ mr: 2, objectFit: 'contain', width: 50, height: 50 }}
                                        />
                                        <Stack>
                                          <Typography variant="body2" fontWeight="medium">{item.itemName}</Typography>
                                          <Typography variant="body2">Price: ${item.unitPrice.toFixed(2)} x {item.quantity} = ${item.effectivePrice.toFixed(2)}</Typography>
                                        </Stack>
                                      </Card>
                                    ))}
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h6" color="text.secondary">
            No profile found. Please create one.
          </Typography>
          <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={() => navigate('/create-profile')}>
            Create Profile
          </Button>
        </Box>
      )}

      {/* Edit Basic Details Dialog */}
      <Dialog open={editBasicOpen} onClose={() => setEditBasicOpen(false)}>
        <DialogTitle>Edit Basic Details</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="First Name"
              value={basicDetails.firstName || ''}
              onChange={(e) => setBasicDetails({ ...basicDetails, firstName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Last Name"
              value={basicDetails.lastName || ''}
              onChange={(e) => setBasicDetails({ ...basicDetails, lastName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={basicDetails.mail || ''}
              onChange={(e) => setBasicDetails({ ...basicDetails, mail: e.target.value })}
              fullWidth
            />
            <TextField
              label="Mobile"
              value={basicDetails.mobileNo || ''}
              onChange={(e) => setBasicDetails({ ...basicDetails, mobileNo: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditBasicOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditBasic}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog open={editAddressOpen} onClose={() => setEditAddressOpen(false)}>
        <DialogTitle>Edit Address</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Address Type</InputLabel>
              <Select
                value={addressDetails.addressType}
                onChange={(e) => setAddressDetails({ ...addressDetails, addressType: e.target.value as string })}
              >
                <MenuItem value="home">Home</MenuItem>
                <MenuItem value="work">Work</MenuItem>
                <MenuItem value="others">Others</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Address Description"
              value={addressDetails.addressDesc || ''}
              onChange={(e) => setAddressDetails({ ...addressDetails, addressDesc: e.target.value || null })}
              fullWidth
            />
            <TextField
              label="Address Line 1"
              value={addressDetails.addLine1}
              onChange={(e) => setAddressDetails({ ...addressDetails, addLine1: e.target.value })}
              fullWidth
            />
            <TextField
              label="Address Line 2"
              value={addressDetails.addLine2}
              onChange={(e) => setAddressDetails({ ...addressDetails, addLine2: e.target.value })}
              fullWidth
            />
            <TextField
              label="Address Line 3"
              value={addressDetails.addLine3}
              onChange={(e) => setAddressDetails({ ...addressDetails, addLine3: e.target.value })}
              fullWidth
            />
            <TextField
              label="Pincode"
              value={addressDetails.pincode}
              onChange={(e) => setAddressDetails({ ...addressDetails, pincode: e.target.value })}
              fullWidth
            />
            <TextField
              label="Country"
              value={addressDetails.country}
              onChange={(e) => setAddressDetails({ ...addressDetails, country: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditAddressOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditAddress}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Address Dialog */}
      <Dialog open={addAddressOpen} onClose={() => setAddAddressOpen(false)}>
        <DialogTitle>Add Address</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Address Type</InputLabel>
              <Select
                value={addressDetails.addressType}
                onChange={(e) => setAddressDetails({ ...addressDetails, addressType: e.target.value as string })}
              >
                <MenuItem value="home" disabled={existingAddressTypes.includes('home')}>Home</MenuItem>
                <MenuItem value="work" disabled={existingAddressTypes.includes('work')}>Work</MenuItem>
                <MenuItem value="others" disabled={existingAddressTypes.includes('others')}>Others</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Address Description"
              value={addressDetails.addressDesc || ''}
              onChange={(e) => setAddressDetails({ ...addressDetails, addressDesc: e.target.value || null })}
              fullWidth
            />
            <TextField
              label="Address Line 1"
              value={addressDetails.addLine1}
              onChange={(e) => setAddressDetails({ ...addressDetails, addLine1: e.target.value })}
              fullWidth
            />
            <TextField
              label="Address Line 2"
              value={addressDetails.addLine2}
              onChange={(e) => setAddressDetails({ ...addressDetails, addLine2: e.target.value })}
              fullWidth
            />
            <TextField
              label="Address Line 3"
              value={addressDetails.addLine3}
              onChange={(e) => setAddressDetails({ ...addressDetails, addLine3: e.target.value })}
              fullWidth
            />
            <TextField
              label="Pincode"
              value={addressDetails.pincode}
              onChange={(e) => setAddressDetails({ ...addressDetails, pincode: e.target.value })}
              fullWidth
            />
            <TextField
              label="Country"
              value={addressDetails.country}
              onChange={(e) => setAddressDetails({ ...addressDetails, country: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAddressOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddAddress}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onClose={() => { setChangePasswordOpen(false); setOldPassword(''); setNewPassword(''); }}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="Old Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              fullWidth
            />
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setChangePasswordOpen(false); setOldPassword(''); setNewPassword(''); }}>Cancel</Button>
          <Button variant="contained" disabled={!oldPassword || !newPassword} onClick={handleChangePassword}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Upload/Change Profile Photo Dialog */}
      <Dialog open={uploadPhotoOpen} onClose={() => { setUploadPhotoOpen(false); setSelectedFile(null); }}>
        <DialogTitle>{profilePhotoUrl ? 'Change Profile Photo' : 'Upload Profile Photo'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {selectedFile && <Typography variant="body2">Selected file: {selectedFile.name}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setUploadPhotoOpen(false); setSelectedFile(null); }}>Cancel</Button>
          <Button variant="contained" disabled={!selectedFile} onClick={handleUploadProfilePhoto}>Upload</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;