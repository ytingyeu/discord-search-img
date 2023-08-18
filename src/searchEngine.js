import fs from "fs";
import axios from "axios";
import { htmlEncode } from "js-htmlencode";
import { image_search } from "duckduckgo-images-api";
import { constantStrings } from "./constants";

const jsonPath = "./ignoreSites.json";
const rawdata = fs.readFileSync(jsonPath);
let ignoreSites = new Set(JSON.parse(rawdata));

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
 * Validate if the link can be access out of the host
 * @param {string} imageLink
 * @returns {boolean}
 */
const validateAccess = async (imageLink) => {
  const hostnameRegex =
    /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/gim;

  const hostname = hostnameRegex.exec(imageLink)[1];

  // ignore restricted sites, i.e. Facebook, or not reachable sites
  if (ignoreSites.has(hostname)) {
    return false;
  }

  // validate if can make GET request without errors
  const status = await axios
    .get(imageLink)
    .then((response) => {
      return response.status;
    })
    .catch((error) => {
      return 400;
    });

  if (status === 200) {
    return true;
  }

  ignoreSites.add(hostname);

  fs.writeFile(jsonPath, JSON.stringify([...ignoreSites.values()]), (err) => {
    if (err) console.log("Error writing file:", err);
  });

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
    if (process.env.NODE_ENV == "development") {
      console.log("link: " + data["items"][i]["link"]);
      console.log("displayLink: " + data["items"][i]["displayLink"]);
      console.log("contextLink:" + data["items"][i]["image"].contextLink);
      console.log("--------------");
    }

    const imageLink = data["items"][i]["link"];

    // validate file extension
    if (!hasValideExt(imageLink, targetExtension)) {
      continue;
    }

    // validate if can access
    if (validateAccess(imageLink)) {
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

    // validate file extension
    if (hasValideExt(imageLink, targetExtension)) {
      continue;
    }

    // ignore restricted site, i.e. Facebook
    if (validateAccess(imageLink)) {
      return imageLink;
    }
  }

  return constantStrings.notFoundMessage;
};
