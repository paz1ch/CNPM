const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'restaurant'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
},  
{
        timestamps: true
}
);

userSchema.pre('save', async function(next){
    if(this.isModified('password')){
        try{
            this.password = await argon2.hash(this.password)
        }catch(error){
            return next(error)
        }
    }
})

userSchema.methods.comparePassword = async function(password){
    try{
        return await argon2.verify(this.password, password)
    }catch(error){
        throw error
    }
}

userSchema.index({username: 'text'});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
