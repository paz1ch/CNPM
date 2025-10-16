
const User = require('../models/user');
const generateTokens = require('../utils/generateToken');
const logger = require('../utils/logger');
const { validateRegistration } = require('../utils/validation');


//dang ky nguoi dung
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
        const { email, password, username } = req.body
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

        const {accessToken, refreshToken} = await generateTokens(user)
        
        res.status(201).json({
            success : true,
            message : 'User registered successfully',
            accessToken,
            refreshToken,
        })

    } catch (e) {
        logger.error('loi dang ky: ', e)
        res.status(500).json({
            success : false,
            message : 'Internal server error',
        })
    }
};


module.exports = { registerUser };