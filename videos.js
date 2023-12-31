const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

// database schema
const videoSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: true
        },
        description:{
            type: String,
            required: false
        },
        thumbUrl:{
            type: String,
            required: true
        },
        pageno:{
            type: Number,
            index: true, //indexing based on page number property
            required: true
            
        }
    }
);

module.exports = mongoose.model('Video', videoSchema);