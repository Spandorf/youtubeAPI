// type "npm run devStart" to run the server

const express = require('express');
const { default: mongoose } = require('mongoose');
const { google } = require('googleapis');
const Video = require('./videos');
require('dotenv').config();
const app = express();

/* Init for the mongodb connection */
mongoose.connect('mongodb://localhost/pagination');
const db = mongoose.connection;
db.once('open', async ()=> {
    if(await Video.countDocuments().exec() > 0) {
        db.dropDatabase();
    }
    console.log("Results updated");
    getYoutubeResults();
});

// API endpoint: see request.rest file: 
app.get('/videos', paginatedResults(Video), (req,res)=>{
    res.json(res.paginatedResults);
});

/* Function returns paginated results */
function paginatedResults(model, req){
    return async (req,res, next)=> {
        const page = parseInt(req.query.page);
        const limit = req.query.limit;

        const startIndex = (page-1)*limit;
        const endIndex = page*limit;

        const results = {};

        results.next = {
            page: page + 1,
            limit:limit
        };

        results.prev = {
            page: page - 1,
            limit:limit
        };

        try {
            results.results = await model.find().limit(limit).skip(startIndex).exec();
            res.paginatedResults = results;
            next();
        } catch(e) {
            res.status(500).json({message: e.message});
        }

    };
}

/* Calls youtube api at set intervals */
function getYoutubeResults() {
    let count = 0;
    let next_token = '';

    setInterval(() => {
        google.youtube('v3').search.list(
            {
                key: process.env.YOUTUBE_TOKEN,
                part: 'snippet',
                q: '14er Hikes',
                maxResults: 10,
                order: 'date',
                pageToken: next_token
            }
        ).then((response)=> {
            console.log(response);
            const {data} = response;
            next_token = data.nextPageToken;
            data.items.forEach(item=> {
                console.log(`Title: ${item.snippet.title}\nDescription: ${item.snippet.description}\n`);
                Video.create(
                    {
                        name:item.snippet.title, 
                        description:item.snippet.description, 
                        thumbUrl: item.snippet.thumbnails.default.url,
                        pageno: Math.floor((count/10)) + 1
                    }
                );
                ++count;
            });
        }).catch((err)=> console.log(err));
    }, 10000);
}

app.listen(3000);
