import axios from 'axios';

const testLogin = async () => {
    try {
        const response = await axios.post('http://localhost:3000/v1/auth/login', {
            email: 'admin@example.com',
            password: '12345678'
        });
        console.log('Login Response Data:', response.data);
        console.log('Role:', response.data.role);
    } catch (error) {
        console.error('Login Failed:', error.response ? error.response.data : error.message);
    }
};

testLogin();
