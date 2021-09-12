import axios from "axios";
import { htmlEncode } from "js-htmlencode";
import { image_search } from "duckduckgo-images-api";

const hasValideExt = (imageLink, targetExtension) => {
  const staticImgExt = [".jpg", ".jpeg", ".png", ".bmp"];
  const imgExtRe = /\.(jpg|jpeg|png|bmp|gif)(?=\??)/gm;

  const ma = imageLink.match(imgExtRe);

  if (ma === null) {
    return false;
  }

  const imgExt = ma[ma.length - 1];

  if (targetExtension === "jpg" || targetExtension === "duckjpg") {
    return staticImgExt.includes(imgExt);
  }

  if (targetExtension === "gif" || targetExtension === "duckgif") {
    return imgExt === ".gif";
  }

  return false;
};

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

  return await axios
    .get(uri, config)
    .then((res) => {
      for (let i = 0; i < res.data["items"].length; i++) {
        const imageLink = res.data["items"][i]["link"];

        // ignore Facebook images
        if (imageLink.includes("fbsbx")) {
          continue;
        }

        // validate file extension
        if (hasValideExt(imageLink, targetExtension)) {
          return imageLink;
        }
      }

      return "找不到拉幹";
    })
    .catch((error) => {
      throw error;
    });
};

export const duckduckgoSearch = async (searchTerm, targetExtension) => {
  if (targetExtension === "duckgif") {
    searchTerm = `${searchTerm}+gif`;
  }

  const parms = {
    query: searchTerm,
    moderate: false,
    iterations: 1,
  };

  const imgLink = await image_search(parms)
    .then((data) => {
      for (let i = 0; i < data.length; i++) {
        const imageLink = data[i].image;
        if (hasValideExt(imageLink, targetExtension)) {
          return data[i].image;
        }
      }
      return "找不到拉幹";
    })
    .catch((error) => {
      throw error;
    });

  return imgLink;
};
