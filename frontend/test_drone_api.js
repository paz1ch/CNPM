import axios from 'axios';

const testDroneApi = async () => {
    try {
        const response = await axios.get('http://localhost:3000/v1/drones');
        console.log('Drone API Response:', response.data);
    } catch (error) {
        console.error('Drone API Failed:', error.response ? error.response.data : error.message);
        console.error('Status:', error.response ? error.response.status : 'Unknown');
    }
};

testDroneApi();
