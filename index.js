const express = require("express");
// will use this later to send requests
const http = require("http");
// import env variables
require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_, res) => {
  res.status(200).send("Server is working.");
});

app.listen(port, () => {
  console.log(`🌏 Server is running at http://localhost:${port}, GREAT!!!`);
});

/** Fetching the movie */
app.post("/getmovie", (req, res) => {
  const {queryResult} = req.body
  const movieToSearch = queryResult?.parameters?.movie

  const api = encodeURI(
    `${process.env.BASE_URL}/?t=${movieToSearch}&apiKey=${process.env.API_KEY}`
  );

  http.get(
    api,
    (responseFromAPI) => {
      let completeResponse = "";
      responseFromAPI.on("data", (chunk) => {
        completeResponse += chunk;
      });
      responseFromAPI.on("end", () => {
        const movie = JSON.parse(completeResponse);

        let dataToSend = movieToSearch;
        dataToSend = `${movie.Title} was released in the year ${movie.Year}. It is directed by ${movie.Director} and stars ${movie.Actors}. Here some glimpse of the plot: ${movie.Plot}.`;

        return res.json({
          fulfillmentText: dataToSend,
          data: req.body,
          source: "getmovie",
        });
      });
    },
    (error) => {
      return res.json({
        fulfillmentText: "Could not get results at this time",
        data: error,
        source: "getmovie",
      });
    }
  );
});
