import fs from "fs";
import axios from "axios";
import { htmlEncode } from "js-htmlencode";
import { image_search } from "duckduckgo-images-api";
import { constantStrings } from "./constants";

const jsonPath = "./ignoreSites.json";
const rawdata = fs.readFileSync(jsonPath);
let ignoreSites = new Set(JSON.parse(rawdata).ignoreSites);

/**
 * Validate if the image can be accessed out of the soure
 * @param {string} imageLink
 * @returns {boolean}
 */
const isAccessible = async (imageLink) => {
  const status = await axios
    .get(imageLink)
    .then((response) => {
      return response.status;
    })
    .catch((error) => {
      return 400;
    });

  return status === 200;
};

/**
 * Ensure the end of the link is image extension s.t. Discord and display it
 * @param {string} imageLink
 * @param {string} targetExtension
 * @returns {boolean}
 */
const hasValideExt = (imageLink, targetExtension) => {
  const staticImgExt = ["jpg", "jpeg", "png", "bmp"];
  const imgExtRe = /(?<=\.)(jpg|jpeg|png|bmp|gif)(?=\??)/gm;

  const ma = imageLink.match(imgExtRe);

  if (ma === null) {
    return false;
  }

  const imgExt = ma[ma.length - 1];

  if (targetExtension === "jpg" || targetExtension === "duckjpg") {
    return staticImgExt.includes(imgExt);
  }

  if (targetExtension === "gif" || targetExtension === "duckgif") {
    return imgExt === "gif";
  }

  return false;
};

/**
 * Return an image link based on Google Search
 * @param {string} searchTerm
 * @param {string} targetExtension
 * @returns {string} Link of an image
 */
export const googleSearch = async (searchTerm, targetExtension) => {
  let encodedSearchTerm = "";

  if (targetExtension === "gif") {
    encodedSearchTerm = htmlEncode(`${searchTerm}+gif`);
  } else {
    encodedSearchTerm = htmlEncode(searchTerm);
  }

  const config = {
    headers: {
      Accept: "application/json",
    },
  };

  // Custom Search Engine ID
  const googleSearchCx = process.env["GOOGLE_SEARCH_CX"];

  // Custom Search JSON API Key
  const googleSearchKey = process.env["GOOGLE_SEARCH_KEY"];

  const uri = encodeURI(
    `https://customsearch.googleapis.com/customsearch/v1?cx=${googleSearchCx}&q=${encodedSearchTerm}&safe=off&searchType=image&key=${googleSearchKey}`
  );

  const data = await axios
    .get(uri, config)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      throw error;
    });

  for (let i = 0; i < data["items"].length; i++) {
    // ignore restricted sites, i.e. Facebook, or not reachable sites
    const displayLink = data["items"][i]["displayLink"];
    if (ignoreSites.has(displayLink)) {
      continue;
    }

    const imageLink = data["items"][i]["link"];
    const isOk = await isAccessible(imageLink);

    if (!isOk) {
      ignoreSites.add(data["items"][i]["displayLink"]);

      fs.writeFile(
        jsonPath,
        JSON.stringify([...ignoreSites.values()]),
        (err) => {
          if (err) console.log("Error writing file:", err);
        }
      );

      continue;
    }

    // validate file extension
    if (hasValideExt(imageLink, targetExtension)) {
      return imageLink;
    }
  }

  return constantStrings.notFoundMessage;
};

/**
 * Return an image link based on DuckDuckGo
 * @param {string} searchTerm
 * @param {string} targetExtension
 * @returns {string} Link of an image
 */
export const duckduckgoSearch = async (searchTerm, targetExtension) => {
  if (targetExtension === "duckgif") {
    searchTerm = `${searchTerm}+gif`;
  }

  const parms = {
    query: searchTerm,
    moderate: false,
    iterations: 1,
  };

  const data = await image_search(parms)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      throw error;
    });

  for (let i = 0; i < data.length; i++) {
    const imageLink = data[i].image;

    // ignore restricted site, i.e. Facebook
    const isOk = await isAccessible(imageLink);

    if (!isOk) {
      continue;
    }

    // validate file extension
    if (hasValideExt(imageLink, targetExtension)) {
      return imageLink;
    }
  }
  return constantStrings.notFoundMessage;
};
