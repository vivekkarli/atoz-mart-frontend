import React, { useState } from 'react';
import { Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, DialogActions, Switch, FormControlLabel, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import DeleteIcon from '@mui/icons-material/Delete';

interface BasicDetails {
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

const CreateProfile: React.FC = () => {
  const [basicDetails, setBasicDetails] = useState<BasicDetails>({
    firstName: '',
    lastName: '',
    mail: '',
    mobileNo: '',
  });
  const [addresses, setAddresses] = useState<Address[]>([
    { addressType: 'home', addressDesc: null, defaultAddress: true, addLine1: '', addLine2: '', addLine3: '', pincode: '', country: '' },
  ]);
  const navigate = useNavigate();

  const handleAddAddress = () => {
    const newAddressType = addresses.length === 0 ? 'home' : addresses.length === 1 ? 'work' : 'others';
    setAddresses([...addresses, { addressType: newAddressType, addressDesc: null, defaultAddress: false, addLine1: '', addLine2: '', addLine3: '', pincode: '', country: '' }]);
  };

  const handleRemoveAddress = (index: number) => {
    const updatedAddresses = addresses.filter((_, i) => i !== index);
    if (updatedAddresses.length === 0) {
      updatedAddresses.push({ addressType: 'home', addressDesc: null, defaultAddress: true, addLine1: '', addLine2: '', addLine3: '', pincode: '', country: '' });
    } else if (addresses[index].defaultAddress) {
      updatedAddresses[0].defaultAddress = true; // Set first address as default if removed one was default
    }
    setAddresses(updatedAddresses);
  };

  const handleSetDefault = (index: number) => {
    setAddresses(addresses.map((addr, i) => ({
      ...addr,
      defaultAddress: i === index,
    })));
  };

  const handleAddressChange = (index: number, field: keyof Address, value: string | null) => {
    const updatedAddresses = [...addresses];
    updatedAddresses[index] = { ...updatedAddresses[index], [field]: value };
    setAddresses(updatedAddresses);
  };

  const handleCreateProfile = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';
      const requestBody = {
        basicDetails: { firstName: basicDetails.firstName, lastName: basicDetails.lastName, mail: basicDetails.mail, mobileNo: basicDetails.mobileNo },
        addressDetails: addresses,
      };
      const response = await axios.post(
        `${baseUrl}/profile/profile`,
        requestBody,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.status === 201) {
        navigate('/profile');
        toast.success('Profile created successfully');
      }
    } catch (error: any) {
      const errorData = error.response?.data || { errorMsg: 'Failed to create profile' };
      toast.error(errorData.errorMsg);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Create Profile</Typography>
      <Typography variant="h6">Basic Details</Typography>
      <TextField label="First Name" value={basicDetails.firstName} onChange={(e) => setBasicDetails({ ...basicDetails, firstName: e.target.value })} sx={{ mb: 2 }} fullWidth />
      <TextField label="Last Name" value={basicDetails.lastName} onChange={(e) => setBasicDetails({ ...basicDetails, lastName: e.target.value })} sx={{ mb: 2 }} fullWidth />
      <TextField label="Email" value={basicDetails.mail} onChange={(e) => setBasicDetails({ ...basicDetails, mail: e.target.value })} sx={{ mb: 2 }} fullWidth />
      <TextField label="Mobile" value={basicDetails.mobileNo} onChange={(e) => setBasicDetails({ ...basicDetails, mobileNo: e.target.value })} sx={{ mb: 2 }} fullWidth />

      <Typography variant="h6" sx={{ mt: 2 }}>Address Details</Typography>
      {addresses.map((address, index) => (
        <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
          <FormControl sx={{ minWidth: 120, mb: 2 }} fullWidth>
            <InputLabel>Address Type</InputLabel>
            <Select value={address.addressType} onChange={(e) => handleAddressChange(index, 'addressType', e.target.value as string)} disabled={index > 2}>
              <MenuItem value="home" disabled={addresses.some((a, i) => i !== index && a.addressType === 'home')}>Home</MenuItem>
              <MenuItem value="work" disabled={addresses.some((a, i) => i !== index && a.addressType === 'work')}>Work</MenuItem>
              <MenuItem value="others" disabled={addresses.some((a, i) => i !== index && a.addressType === 'others')}>Others</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Address Desc" value={address.addressDesc || ''} onChange={(e) => handleAddressChange(index, 'addressDesc', e.target.value || null)} sx={{ mb: 2 }} fullWidth />
          <TextField label="Add Line 1" value={address.addLine1} onChange={(e) => handleAddressChange(index, 'addLine1', e.target.value)} sx={{ mb: 2 }} fullWidth />
          <TextField label="Add Line 2" value={address.addLine2} onChange={(e) => handleAddressChange(index, 'addLine2', e.target.value)} sx={{ mb: 2 }} fullWidth />
          <TextField label="Add Line 3" value={address.addLine3} onChange={(e) => handleAddressChange(index, 'addLine3', e.target.value)} sx={{ mb: 2 }} fullWidth />
          <TextField label="Pincode" value={address.pincode} onChange={(e) => handleAddressChange(index, 'pincode', e.target.value)} sx={{ mb: 2 }} fullWidth />
          <TextField label="Country" value={address.country} onChange={(e) => handleAddressChange(index, 'country', e.target.value)} sx={{ mb: 2 }} fullWidth />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, alignItems: 'center' }}>
            <IconButton onClick={() => handleRemoveAddress(index)} disabled={addresses.length <= 1}>
              <DeleteIcon />
            </IconButton>
            <FormControlLabel
              control={
                <Switch
                  checked={address.defaultAddress}
                  onChange={() => handleSetDefault(index)}
                  color="primary"
                  sx={{
                    '& .MuiSwitch-thumb': { backgroundColor: '#fff' },
                    '& .MuiSwitch-track': { backgroundColor: '#ccc' },
                    '& .Mui-checked + .MuiSwitch-track': { backgroundColor: '#1976d2' },
                    '& .Mui-checked .MuiSwitch-thumb': { backgroundColor: '#1976d2' },
                  }}
                />
              }
              label="Set as Default"
              labelPlacement="start"
              sx={{ ml: 0 }}
            />
          </Box>
        </Box>
      ))}
      <Button onClick={handleAddAddress} disabled={addresses.length >= 3}>Add Address</Button>

      <DialogActions sx={{ mt: 2 }}>
        <Button onClick={() => navigate('/profile')}>Cancel</Button>
        <Button onClick={handleCreateProfile}>Create Profile</Button>
      </DialogActions>
    </Box>
  );
};

export default CreateProfile;