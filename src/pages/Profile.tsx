import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Select, MenuItem, FormControl, InputLabel, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary, AccordionDetails, Card, CardContent } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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

interface OrderDetail {
  orderId: number;
  paymentStatus: string;
  deliveryStatus: string;
  orderStatus: string;
  orderTotal: number;
  orderedOn: string;
  orderItems: { itemId: string; itemName: string; unitPrice: number; quantity: number; effectivePrice: number }[] | null;
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
      const response = await axios.get(
        `${baseUrl}/profile/profile`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 200) {
        setProfile(response.data);
        toast.success('Profile loaded successfully');
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
    }
  };

  const fetchOrders = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const response = await axios.get(
        `${baseUrl}/order/orders`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
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
      const response = await axios.get(
        `${baseUrl}/order/orders?orderId=${orderId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 200) {
        setOrderDetails(prev => ({
          ...prev,
          [orderId]: {
            ...response.data[0],
            orderedOn: new Date(response.data[0].orderedOn).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          }
        }));
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
      const response = await axios.patch(
        `${baseUrl}/profile/profile`,
        requestBody,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
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
      const response = await axios.patch(
        `${baseUrl}/profile/profile`,
        requestBody,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
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
      const response = await axios.patch(
        `${baseUrl}/profile/profile`,
        requestBody,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
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
      const response = await axios.patch(
        `${baseUrl}/profile/profile/address?addressType=${addressType}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
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
      const response = await axios.delete(
        `${baseUrl}/profile/profile/address?addressType=${addressType}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
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
      const response = await axios.delete(
        `${baseUrl}/profile/profile/address`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
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
      const requestBody = {
        oldPassword: oldPassword,
        newPassword: newPassword,
      };
      const response = await axios.patch(
        `${baseUrl}/authserver/change-password`,
        requestBody,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 202) {
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
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Profile</Typography>
      {profile ? (
        <>
          <Typography variant="h6">Basic Details</Typography>
          <Typography>Username: {profile.basicDetails.username}</Typography>
          <Typography>First Name: {profile.basicDetails.firstName}</Typography>
          <Typography>Last Name: {profile.basicDetails.lastName}</Typography>
          <Typography>Email: {profile.basicDetails.mail}</Typography>
          <Typography>Mobile: {profile.basicDetails.mobileNo}</Typography>
          <Button onClick={() => { setBasicDetails({ firstName: profile.basicDetails.firstName, lastName: profile.basicDetails.lastName, mail: profile.basicDetails.mail, mobileNo: profile.basicDetails.mobileNo }); setEditBasicOpen(true); }}>Edit Basic Details</Button>
          <Button onClick={() => setChangePasswordOpen(true)} sx={{ ml: 2 }}>Change Password</Button>

          <Typography variant="h6" sx={{ mt: 2 }}>Address Details</Typography>
          {profile.addressDetails.map((address) => (
            <Box key={address.addressType} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
              <Typography>{`${address.addLine1}, ${address.addLine2}, ${address.addLine3}, ${address.pincode}, ${address.country} (${address.addressType}${address.defaultAddress ? ' - Default' : ''})`}</Typography>
              <Button onClick={() => { setAddressDetails(address); setEditAddressOpen(true); setSelectedAddressType(address.addressType); }}>Edit</Button>
              <Button onClick={() => handleChangeDefaultAddress(address.addressType)} disabled={address.defaultAddress}>Set as Default</Button>
              <Button onClick={() => handleDeleteAddress(address.addressType)}>Delete</Button>
            </Box>
          ))}
          <Button onClick={handleDeleteAllAddresses}>Delete All Addresses</Button>
          <Button onClick={() => setAddAddressOpen(true)} disabled={isAddAddressDisabled}>Add Address</Button>

          <Typography variant="h6" sx={{ mt: 2 }}>Order Details</Typography>
          <Accordion onChange={(_, expanded) => { if (expanded && orders.length === 0) fetchOrders(); }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>View Orders</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {orders.map((order) => (
                <Accordion key={order.orderId} onChange={(_, expanded) => { if (expanded && !orderDetails[order.orderId]) fetchOrderDetails(orderId); }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Order ID: {order.orderId} | Delivery Status: {order.deliveryStatus} | Ordered On: {order.orderedOn}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {orderDetails[order.orderId] && (
                      <Card sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography>Order ID: {orderDetails[order.orderId].orderId}</Typography>
                          <Typography>Payment Status: {orderDetails[order.orderId].paymentStatus}</Typography>
                          <Typography>Delivery Status: {orderDetails[order.orderId].deliveryStatus}</Typography>
                          <Typography>Order Status: {orderDetails[order.orderId].orderStatus}</Typography>
                          <Typography>Order Total: ${orderDetails[order.orderId].orderTotal.toFixed(2)}</Typography>
                          <Typography>Ordered On: {orderDetails[order.orderId].orderedOn}</Typography>
                          {orderDetails[order.orderId].orderItems && orderDetails[order.orderId].orderItems.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              {orderDetails[order.orderId].orderItems.map((item, index) => (
                                <Card key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1, border: '1px solid #eee', borderRadius: 2 }}>
                                  <img src={`https://via.placeholder.com/50?text=Item+${item.itemId}`} alt={item.itemName} style={{ marginRight: '10px' }} />
                                  <Box>
                                    <Typography>{item.itemName}</Typography>
                                    <Typography>Price: ${item.unitPrice.toFixed(2)} x {item.quantity} = ${item.effectivePrice.toFixed(2)}</Typography>
                                  </Box>
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
        </>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography>No profile found. Please create one.</Typography>
          <Button onClick={() => navigate('/create-profile')} variant="contained" sx={{ mt: 2 }}>Create Profile</Button>
        </Box>
      )}
      <Dialog open={editBasicOpen} onClose={() => setEditBasicOpen(false)}>
        <DialogTitle>Edit Basic Details</DialogTitle>
        <DialogContent>
          <TextField label="First Name" value={basicDetails.firstName || ''} onChange={(e) => setBasicDetails({ ...basicDetails, firstName: e.target.value })} sx={{ mb: 2 }} fullWidth />
          <TextField label="Last Name" value={basicDetails.lastName || ''} onChange={(e) => setBasicDetails({ ...basicDetails, lastName: e.target.value })} sx={{ mb: 2 }} fullWidth />
          <TextField label="Email" value={basicDetails.mail || ''} onChange={(e) => setBasicDetails({ ...basicDetails, mail: e.target.value })} sx={{ mb: 2 }} fullWidth />
          <TextField label="Mobile" value={basicDetails.mobileNo || ''} onChange={(e) => setBasicDetails({ ...basicDetails, mobileNo: e.target.value })} sx={{ mb: 2 }} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditBasicOpen(false)}>Cancel</Button>
          <Button onClick={handleEditBasic}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editAddressOpen} onClose={() => setEditAddressOpen(false)}>
        <DialogTitle>Edit Address</DialogTitle>
        <DialogContent>
          <FormControl sx={{ minWidth: 120, mb: 2 }} fullWidth>
            <InputLabel>Address Type</InputLabel>
            <Select value={addressDetails.addressType} onChange={(e) => setAddressDetails({ ...addressDetails, addressType: e.target.value as string })}>
              <MenuItem value="home">Home</MenuItem>
              <MenuItem value="work">Work</MenuItem>
              <MenuItem value="others">Others</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Address Desc" value={addressDetails.addressDesc || ''} onChange={(e) => setAddressDetails({ ...addressDetails, addressDesc: e.target.value || null })} sx={{ mb: 2 }} fullWidth />
          <TextField label="Add Line 1" value={addressDetails.addLine1} onChange={(e) => setAddressDetails({ ...addressDetails, addLine1: e.target.value })} sx={{ mb: 2 }} fullWidth />
          <TextField label="Add Line 2" value={addressDetails.addLine2} onChange={(e) => setAddressDetails({ ...addressDetails, addLine2: e.target.value })} sx={{ mb: 2 }} fullWidth />
          <TextField label="Add Line 3" value={addressDetails.addLine3} onChange={(e) => setAddressDetails({ ...addressDetails, addLine3: e.target.value })} sx={{ mb: 2 }} fullWidth />
          <TextField label="Pincode" value={addressDetails.pincode} onChange={(e) => setAddressDetails({ ...addressDetails, pincode: e.target.value })} sx={{ mb: 2 }} fullWidth />
          <TextField label="Country" value={addressDetails.country} onChange={(e) => setAddressDetails({ ...addressDetails, country: e.target.value })} sx={{ mb: 2 }} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditAddressOpen(false)}>Cancel</Button>
          <Button onClick={handleEditAddress}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addAddressOpen} onClose={() => setAddAddressOpen(false)}>
        <DialogTitle>Add Address</DialogTitle>
        <DialogContent>
          <FormControl sx={{ minWidth: 120, mb: 2 }} fullWidth>
            <InputLabel>Address Type</InputLabel>
            <Select value={addressDetails.addressType} onChange={(e) => setAddressDetails({ ...addressDetails, addressType: e.target.value as string })}>
              <MenuItem value="home" disabled={existingAddressTypes.includes('home')}>Home</MenuItem>
              <MenuItem value="work" disabled={existingAddressTypes.includes('work')}>Work</MenuItem>
              <MenuItem value="others" disabled={existingAddressTypes.includes('others')}>Others</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Address Desc" value={addressDetails.addressDesc || ''} onChange={(e) => setAddressDetails({ ...addressDetails, addressDesc: e.target.value || null })} sx={{ mb: 2 }} fullWidth />
          <TextField label="Add Line 1" value={addressDetails.addLine1} onChange={(e) => setAddressDetails({ ...addressDetails, addLine1: e.target.value })} sx={{ mb: 2 }} fullWidth />
          <TextField label="Add Line 2" value={addressDetails.addLine2} onChange={(e) => setAddressDetails({ ...addressDetails, addLine2: e.target.value })} sx={{ mb: 2 }} fullWidth />
          <TextField label="Add Line 3" value={addressDetails.addLine3} onChange={(e) => setAddressDetails({ ...addressDetails, addLine3: e.target.value })} sx={{ mb: 2 }} fullWidth />
          <TextField label="Pincode" value={addressDetails.pincode} onChange={(e) => setAddressDetails({ ...addressDetails, pincode: e.target.value })} sx={{ mb: 2 }} fullWidth />
          <TextField label="Country" value={addressDetails.country} onChange={(e) => setAddressDetails({ ...addressDetails, country: e.target.value })} sx={{ mb: 2 }} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAddressOpen(false)}>Cancel</Button>
          <Button onClick={handleAddAddress}>Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={changePasswordOpen} onClose={() => { setChangePasswordOpen(false); setOldPassword(''); setNewPassword(''); }}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            label="Old Password"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            sx={{ mb: 2 }}
            fullWidth
          />
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 2 }}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setChangePasswordOpen(false); setOldPassword(''); setNewPassword(''); }}>Cancel</Button>
          <Button onClick={handleChangePassword} disabled={!oldPassword || !newPassword}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;