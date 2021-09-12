import axios from "axios";
import { htmlEncode } from "js-htmlencode";
import { image_search } from "duckduckgo-images-api";

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

  const googleSearchCx = process.env["GOOGLE_SEARCH_CX"];
  const googleSearchKey = process.env["GOOGLE_SEARCH_KEY"];

  const uri = encodeURI(
    `https://customsearch.googleapis.com/customsearch/v1?cx=${googleSearchCx}&q=${encodedSearchTerm}&safe=off&searchType=image&key=${googleSearchKey}`
  );

  return await axios
    .get(uri, config)
    .then((res) => {
      const staticImgExt = [".jpg", ".jpeg", ".png", ".bmp"];
      const imgExtRe = /\.(jpg|jpeg|png|bmp|gif)(?=\??)/gm;

      for (let i = 0; i < res.data["items"].length; i++) {
        const imageLink = res.data["items"][i]["link"];

        const ma = imageLink.match(imgExtRe);

        if (ma === null) {
          continue;
        }

        const imgExt = ma[ma.length - 1];

        // ignore Facebook images
        if (imageLink.includes("fbsbx")) {
          continue;
        }

        // validate file extensions
        if (
          (targetExtension === "jpg" && staticImgExt.includes(imgExt)) ||
          (targetExtension === "gif" && imgExt === ".gif")
        ) {
          return imageLink;
        }
      }

      return "找不到拉幹";
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
