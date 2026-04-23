import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const fetchPortfolio = async () => {
    const response = await axios.get(`${API_URL}/portfolio`);
    return response.data;
};

export const uploadGrowwCSV = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_URL}/upload-groww`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const analyzePortfolio = async (portfolioData, intentData) => {
    const payload = {
        portfolio: portfolioData,
        intent: intentData
    };
    const response = await axios.post(`${API_URL}/analyze`, payload);
    return response.data;
};
