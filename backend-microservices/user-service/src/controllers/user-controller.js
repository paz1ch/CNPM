
const User = require('../models/user');
const generateTokens = require('../utils/generateToken');
const logger = require('../utils/logger');
const { validateRegistration, validatelogin } = require('../utils/validation');


//dang ky 
const registerUser = async (req, res) => {
    logger.info('Registration endpoint hit...')
    try {
        const { error } = validateRegistration(req.body)
        if (error) {
            logger.warn('Validation error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }
        const { email, password, username } = req.body;

        let user = await User.findOne({ $or: [{ email }, { username }] })
        if (user) {
            logger.warn("nguoi dung da ton tai");
            return res.status(400).json({
                success: false,
                message: "nguoi dung da ton tai",
            });
        }

        user = new User({ username, email, password });
        await user.save();
        logger.warn("User saved successfully", user._id);

        const { accessToken, refreshToken } = await generateTokens(user)

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            accessToken,
            refreshToken,
        })

    } catch (e) {
        logger.error('Registration error occured: ', e)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
};

// dang nhap
const loginUser = async (req, res) => {
    logger.info("Login endpoint hit...");
    try {
        const { error } = validatelogin(req.body);
        if (error) {
            logger.warn('Validation error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if(!user){
            logger.warn("Invalid user");
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });      
        }

        //kiem tra mat khau co hop le khong
        const isValidPassword = await user.comparePassword(password);
        if(!isValidPassword){
            logger.warn("Invalid password");
            return res.status(400).json({
                sucess : false,
                message : "Invalid credentials"
            })
        }

        const {accessToken, refreshToken } = await generateTokens(user);

        res.json({
            accessToken,
            refreshToken,
            userId : user._id
        })

    } catch (e) {
        logger.error('Login error occured: ', e)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
}

module.exports = { registerUser };