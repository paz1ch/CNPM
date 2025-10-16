//nguoi dung dang ky

const logger = require('../utils/logger')
const { validatateRegistration } = require('../utils/validation')

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
        let user = await Use.findOne({ $or: [{ email }, { username }] })
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

        const {} = 

    } catch (e) { }
}