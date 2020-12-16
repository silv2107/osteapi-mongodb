const { urlencoded } = require("express");
const { count } = require("./cheese.model");
var Cheese = require("./cheese.model");
var auth = require("./auth-middleware");
module.exports = function(app){
    app.get("/", function(req, res, next){
        res.send("Hej Hej")
    })
    //create a cheese
    app.post("/api/v1/cheeses", auth, function(request, response, next){
      try {
          var cheese = new Cheese({
              name: request.fields.name,
              price: request.fields.price,
              weight: request.fields.weight,
              strength: request.fields.strength,
              brand: request.fields.brand
          });
          cheese.save();

          response.status(201);
          response.json(cheese);
          
      } catch (error) {
        return next(error);
      }  
    })
    //get all cheeses
    app.get("/api/v1/cheeses", async function(request, response, next){
        var limit = parseInt(request.query.limit) || 5;
        var offset = parseInt(request.query.offset) || 0;

        // console.log(limit);
        // console.log(offset);
        // hent oste fra mongo db
        try {
            var result = await Cheese.find().limit(limit).skip(offset);
			var count = (await Cheese.find()).length;

			// ["limit=5", "offset=2"].join("&")

			var qLimit = request.query.limit;
			var qOffset = request.query.offset || 0;

			var queryStringNext = [];
			var queryStringPrevious = [];

			if (qLimit) {
				queryStringNext.push("limit=" + qLimit);
				queryStringPrevious.push("limit=" + qLimit);
			}

			queryStringNext.push("offset=" + (parseInt(qOffset) + limit));

			if (qOffset) {
				queryStringPrevious.push("offset=" + (parseInt(qOffset) - limit));
			}

			var baseUrl = `${request.protocol}://${request.hostname}${ request.hostname == "localhost" ? ":" + process.env.PORT : "" }${ request._parsedUrl.pathname }`;

			var output = {
				count,
				next: (offset + limit < count) ? `${baseUrl}?${queryStringNext.join("&")}` : null,
				previous: offset > 0 ? `${baseUrl}?${queryStringPrevious.join("&")}` : null,
				url: `${baseUrl}?` + (offset ? "offset=" + offset : ""),
				results: result
			}

			response.json(output);
        }
        catch (error){
            return next(error);
        }

    })
    app.get("/api/v1/cheeses/:id", async function(request, response, next){
        try {
            var result =  await Cheese.findById(request.params.id);

            if(!result){
                response.status(404);
                response.end();
                return
            }
            response.json(result)
            
        }catch (error){
                return next(error);
            }
    });
    //update cheese
    app.patch("/api/v1/cheeses/:id", auth, async function(request, response, next){
        try {
            var { name, price, weight, strength, brand} = request.fields;
            var updateObject = {};

            if(name) updateObject.name = name;
            if(price) updateObject.price = price;
            if(weight) updateObject.weight = weight;
            if(strength) updateObject.strength = strength;
            if(brand) updateObject.brand = brand;

            await Cheese.findByIdAndUpdate(request.params.id, updateObject);

            var cheese = await Cheese.findById(request.params.id);
            
            response.status(200);
            response.json(cheese)

        } catch (error) {
            return next(error)
        }
    })
    //delete a single cheese
    app.delete("/api/v1/cheeses/:id", auth, async function(request, response, next){
        try {
            await Cheese.findByIdAndRemove(request.params.id);
            response.status(204);
            response.end();

        } catch (error) {
            return next(error);
        }
    })
};