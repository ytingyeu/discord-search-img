import axios from "axios";
import { htmlEncode } from "js-htmlencode";
import { image_search } from "duckduckgo-images-api";
import { googleSearchCx, googleSearchKey } from "./config";

export const googleSearch = async (searchTerm) => {
  const encodedSearchTerm = htmlEncode(searchTerm);
  const config = {
    headers: {
      Accept: "application/json",
    },
  };

  const uri = encodeURI(
    `https://customsearch.googleapis.com/customsearch/v1?cx=${googleSearchCx}&q=${encodedSearchTerm}&safe=off&searchType=image&key=${googleSearchKey}`
  );

  return await axios
    .get(uri, config)
    .then((res) => {
      return res.data["items"][0]["link"];
    })
    .catch((error) => {
      throw error;
    });
};

export const duckduckgoSearch = async (searchTerm) => {
  const parms = {
    query: searchTerm,
    moderate: false,
    iterations: 1,
  };

  await image_search(parms)
    .then((data) => {
      return data[0].image;
    })
    .catch((error) => {
      throw error;
    });
};
