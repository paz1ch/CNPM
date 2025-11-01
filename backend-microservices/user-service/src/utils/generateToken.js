
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/refreshToken');

const generateTokens = async(user) => {
    const accessToken = jwt.sign({
        userId : user._id,
        username : user.username,
        role: user.role
    }, process.env.JWT_SECRET, {expiresIn : '60m'})

    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7) // token het han trong 7 ngay

    await RefreshToken.create({
        token : refreshTokenString,
        user : user._id,
        expiresAt
    })

    return {accessToken, refreshToken: refreshTokenString}
}

module.exports = generateTokens;