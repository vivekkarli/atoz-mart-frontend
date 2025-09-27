import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart/catalog';

const api = axios.create({
  baseURL: BASE_URL,
});

const getItems = async (params: {
  category?: string;
  fromPriceRange?: number;
  toPriceRange?: number;
  name?: string;
  page?: number;
  size?: number;
  'sort-by'?: string;
  direction?: string;
  lastPage?: boolean;
}) => {
  const token = localStorage.getItem('jwt');
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  try {
    const response = await api.get('/items', { params, headers });
    return response.data;
  } catch (error: any) {
    const errorData = error.response?.data || { errorMsg: 'Network error' };
    throw { status: error.response?.status || 500, message: errorData.errorMsg };
  }
};

const getCategories = async () => {
  const token = localStorage.getItem('jwt');
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  try {
    const response = await api.get('/categories', { headers });
    return response.data;
  } catch (error: any) {
    const errorData = error.response?.data || { errorMsg: 'Network error' };
    throw { status: error.response?.status || 500, message: errorData.errorMsg };
  }
};

export { getItems, getCategories };