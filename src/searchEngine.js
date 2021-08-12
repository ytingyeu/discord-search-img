import axios from "axios";
import { htmlEncode } from "js-htmlencode";
import { image_search } from "duckduckgo-images-api";

export const googleSearch = async (searchTerm, fileExtension) => {
  let encodedSearchTerm = "";

  if (fileExtension == "gif") {
    encodedSearchTerm = htmlEncode(`${searchTerm}+gif`);
  } else {
    encodedSearchTerm = htmlEncode(searchTerm);
  }

  const config = {
    headers: {
      Accept: "application/json",
    },
  };

  const googleSearchCx = process.env["GOOGLE_SEARCH_CX"];
  const googleSearchKey = process.env["GOOGLE_SEARCH_KEY"];

  const uri = encodeURI(
    `https://customsearch.googleapis.com/customsearch/v1?cx=${googleSearchCx}&q=${encodedSearchTerm}&safe=off&searchType=image&key=${googleSearchKey}`
  );

  return await axios
    .get(uri, config)
    .then((res) => {
      let i = 0;

      while (
        res.data["items"][i]["link"].includes("fbsbx") ||
        !res.data["items"][i]["link"].endsWith("gif")
      ) {
        i++;

        if (i == res.data["items"].length) {
          return "找不到拉幹";
        }
      }

      return res.data["items"][i]["link"];
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
