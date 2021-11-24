const express = require("express");
require("dotenv").config();
const http = require("http");
const superagent = require("superagent");

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`🌏 Server is running at http://localhost:${port}, GREAT!!!`);
});

app.get("/", (_, res) => {
  res.status(200).send("Server is working.");
});

// Get a recipe for a meal - done
// Get meals by categories - done
// Get meals by area - done
// Get random meal/recipe. - done
// Get the list of categories of meals - done
// Get the list of countries of meals - done
// Get the list of ingrdients of meals - done

/** Fetching the movie */
app.post("/getmovie", (req, res) => {
  const movieToSearch = req.body?.queryResult?.parameters?.movie
    ? req.body.queryResult.parameters.movie
    : "";

  const api = encodeURI(
    `${process.env.BASE_URL}/?t=${movieToSearch}&apiKey=${process.env.API_KEY}`
  );

  http.get(
    api,
    (responseFromAPI) => {
      let completeResponse = "";
      responseFromAPI.on("data", (chunk) => {
        completeResponse += chunk;
        console.log({ chunk });
      });
      responseFromAPI.on("end", () => {
        const movie = JSON.parse(completeResponse);

        let dataToSend = movieToSearch;
        dataToSend = `${movie.Title} was released in the year ${movie.Year}. It is directed by ${movie.Director} and stars ${movie.Actors}. Here some glimpse of the plot: ${movie.Plot}.`;

        return res.json({
          fulfillmentText: dataToSend,
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

/** Get a recipe for a meal */
app.post("/get-recipe", (request, response) => {
  const mealToSearch = request.body?.queryResult?.parameters?.recipe;
  const api = encodeURI(
    `${process.env.BASE_RECIPE_URL}/search.php?s=${mealToSearch}`
  );

  if (!mealToSearch || mealToSearch === undefined || mealToSearch === "") {
    response.status(400).json({
      error: "No recipe name sent",
    });
    return false;
  }

  superagent
    .post(api)
    .then((apiRes) => {
      let { meals } = apiRes.body,
        dataToSend;

      if (!Array.isArray(meals)) return;

      meals.map((recipes) => (dataToSend = recipes));


      let ingredientsArray = [];
      const mealArray = Object.keys(dataToSend);

      mealArray.map((key) => {
        key.includes("strIngredient") && dataToSend[key] !== ""
          ? ingredientsArray.push({ ingredient: dataToSend[key] })
          : false;
      });

      mealArray.map((key) => {
        key.includes("strMeasure") && dataToSend[key] !== ""
          ? (ingredientsArray = [
              ...ingredientsArray,
              { measure: dataToSend[key] },
            ])
          : false;
      });

      const { strMeal, strCategory, strArea, strInstructions } = dataToSend;

      return response.json({
        message: "Query Successful",
        fulfillmentText: `
        The name of the recipe is ${strMeal}.
        It falls under the ${strCategory} category and its majorly made in the country ${strArea}.

        The ingredients to make this meals are ${ingredientsArray
          .map((item) => item.ingredient)
          .filter((item) => item !== " " && item)}.

        The instruction to make this receipe is as follows: ${strInstructions}`,
      });
    })
    .catch((error) => console.error(error));
});

/** Get a recipes by categories */
app.post("/get-recipe-category", (request, response) => {
  const mealToSearch = request.body?.queryResult?.parameters?.recipeCategory;
  const api = encodeURI(
    `${process.env.BASE_RECIPE_URL}/filter.php?c=${mealToSearch}`
  );

  if (!mealToSearch || mealToSearch === undefined || mealToSearch === "") {
    response.status(400).json({
      error: "No category name sent",
    });
    return false;
  }

  superagent
    .post(api)
    .then((apiRes) => {
      let { meals } = apiRes.body;

      if (!Array.isArray(meals)) return;

      let ingredientsArray = [];

      meals.forEach(item => ingredientsArray.push(item.strMeal))

      return response.json({
        message: "Went through!!",
        fulfillmentText: `
        Meals under this category include:
        ${ingredientsArray.join(", ")}
        `,
      });
    })
    .catch((error) => console.error(error));
});

/** Get a recipes by area */
app.post("/get-recipe-area", (request, response) => {
  const mealToSearch = request.body?.queryResult?.parameters?.recipeArea;
  const api = encodeURI(
    `${process.env.BASE_RECIPE_URL}/filter.php?a=${mealToSearch}`
  );

  superagent
    .post(api)
    .then((apiRes) => {
      let { meals } = apiRes.body;

      if (!Array.isArray(meals)) return;

      let ingredientsArray = [];

      meals.forEach(item => ingredientsArray.push(item.strMeal))

      return response.json({
        message: "Went through!!",
        fulfillmentText: `
        Meals found in this country include:
        ${ingredientsArray.join(", ")}
        `,
      });
    })
    .catch((error) => console.error(error));
});

/** Get random meal/recipe */
app.post("/get-random-recipe", (request, response) => {
  const random = request.body?.queryResult?.parameters?.randomRecipe;

  const api = encodeURI(`${process.env.BASE_RECIPE_URL}/random.php`);

  const IsRandom = random.toLowerCase() === "random" ? true : false;

  superagent
    .post(api)
    .then((apiRes) => {
      let { meals } = apiRes.body;

      let dataToSend;

      meals.map((randomMeal) => (dataToSend = randomMeal));

      if (!IsRandom) {
        response.status(400).json({
          error: "No random keyword passed",
        });

        return false;
      }

      let ingredientsArray = [];
      const mealArray = Object.keys(dataToSend);

      mealArray.map((key) => {
        key.includes("strIngredient") && dataToSend[key] !== ""
          ? ingredientsArray.push({ ingredient: dataToSend[key] })
          : false;
      });

      mealArray.map((key) => {
        key.includes("strMeasure") && dataToSend[key] !== ""
          ? (ingredientsArray = [
              ...ingredientsArray,
              { measure: dataToSend[key] },
            ])
          : false;
      });

      const { strMeal, strCategory, strArea, strInstructions } = dataToSend;

      return response.json({
        message: "Successful",
        fulfillmentText: `
        The name of the recipe is ${strMeal}.
        It falls under the ${strCategory} category and its majorly made in the country ${strArea}.

        The ingredients to make this meals are ${ingredientsArray
          .map((item) => item.ingredient)
          .filter((item) => item !== " " && item)}.

        The instruction to make this receipe is as follows: ${strInstructions}`,
      });
    })
    .catch((error) => response.json({ error: error }));
});

/** Get meal query options */
app.post("/get-meal-list", (request, response) => {
  const keyword = request.body?.queryResult?.parameters?.keyword;

  const keywordData =
    keyword.toLowerCase() === "category"
      ? "c"
      : keyword.toLowerCase() === "country"
      ? "a"
      : keyword.toLowerCase() === "ingredients"
      ? "i"
      : null;

  if (!keywordData) {
    response.status(400).json({
      error: "No valid keyword passed",
    });
    return false;
  }

  const api = encodeURI(
    `${process.env.BASE_RECIPE_URL}/list.php?${keywordData}=list`
  );

  superagent
    .post(api)
    .then((apiRes) => {
      let dataToSend = apiRes.body;

      return response.json({
        message: "Successful",
        fulfillmentText: dataToSend,
      });
    })
    .catch((error) => response.json({ error: error }));
});
