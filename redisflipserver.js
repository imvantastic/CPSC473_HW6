var express = require("express"),
	http = require("http"),
	bodyParser = require("body-parser"),
	app = express(),
	redis = require("redis"),		// require the redis module
    redisClient,
    // declare a results objects to wins/loses
	results = {},
    coinResults = ['heads', 'tails'];

results.wins = 0;
results.losses = 0;

// configure the app to use the client directory for static files
app.use(express.static(__dirname + "/client"));

//tell Express to parse incoming
//JSON objects
app.use(bodyParser.urlencoded({
    extended : true
}));
app.use(bodyParser.json());

//create the server and have it listen
http.createServer(app).listen(3000);

 // create a client to connect to Redis
redisClient = redis.createClient();

redisClient.mget(["wins", "losses"], function (err, redisvalues) {
	// check to make sure there's no error

	if (err !== null) {
		console.log("ERROR: " + err);

		// exit the function
		return;
	}

	// initialize our counter to the integer version of the value stored in Redis, or 0
	// if it's not set
	results.wins = parseInt(redisvalues[0], 10) || 0;
	results.losses = parseInt(redisvalues[1], 10) || 0;

	console.log("redis success");
	// stats
	app.get("/stats", function (req, res) {
	        res.send("Wins: "+ results.wins + " | Losses: " + results.losses);
	});

	app.delete("/stats", function(req, res) {
		console.log("delete /stats");
		redisClient.del("wins");
		redisClient.del("losses");
		//reset global counter
		results.wins = 0;
		results.losses = 0;
		res.send("Wins and Losses counter reset");
	});

	//Flip the Coin 
	app.post("/flip", function (req, res) {
	    //  the coin object is now stored in req.body
	    var coinCallObj = req.body;
	    var coinCallRes = coinCallObj.call;
	    
	    console.log("My flip: " + coinCallRes);
	    
	    //randomly generate heads or tails
	    //var coinResults = ['heads', 'tails'];
	    coinResult = coinResults[Math.floor(Math.random()*coinResults.length)];
	    console.log('Computer Choice: ' + coinResult);
	    
	    //get the result
	    var result;
	    if(coinResult === coinCallRes){
	        result = "Win";
	        redisClient.incr("wins");
	        results.wins = results.wins +1;
	    }
	    else{
	        result = "Lose";
	        redisClient.incr("losses");
	        results.losses = results.losses + 1;
	    }
	    
	    console.log(result);
	    // send back the result
	    //res.json({"result": result});

	    res.json(results);
	});


});

module.exports = results;
