// src/services/imageService.ts
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8072/atozmart';

export const getItemImages = async (itemIds: string[]): Promise<{ itemId: string; location: string }[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/catalog/image?item-id=${itemIds.join(',')}`, {
    });
    if (response.status === 200 || response.status === 206) {
      return response.data;
    }
    throw new Error('Failed to fetch item images');
  } catch (error: any) {
    console.error('Error fetching item images:', error);
    throw error;
  }
};