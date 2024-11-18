import { Helper } from "../utils/helper.js";
import logger from "../utils/logger.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";

// API 类
export class API {
  constructor(url, proxy) {
    this.url = url; // 基础 URL
    this.ua = Helper.randomUserAgent(); // 随机生成的用户代理
    this.proxy = proxy; // 代理服务器地址
    this.agent = this.proxy ? new HttpsProxyAgent(this.proxy) : undefined; // 创建代理对象
  }

  // 生成请求头
  generateHeaders(token) {
    const headers = {
      Accept: "*/*",
      "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
      "Content-Type": "application/json",
      "User-Agent": this.ua, // 用户代理
    };

    if (token) {
      headers.Authorization = token; // 如果有令牌，则添加到请求头
    }
    return headers;
  }

  // 发送请求
  async fetch(
    endpoint,
    method,
    token,
    body = {},
    cred = "include",
    additionalHeader = {},
    customUrl = undefined
  ) {
    try {
      const url = `${customUrl === undefined ? this.url : customUrl}${endpoint}`;
      let headers = this.generateHeaders(token);
      headers = Object.assign(headers, additionalHeader); // 合并请求头
      const options = {
        cache: "default",
        credentials: cred,
        headers,
        method,
        mode: "cors",
        redirect: "follow",
        referrer: this.url,
        agent: this.agent,
        referrerPolicy: "strict-origin-when-cross-origin",
      };

      if (method !== "GET" && Object.keys(body).length > 0) {
        options.body = JSON.stringify(body); // 如果不是 GET 请求且 body 不为空，则设置请求体
      }

      logger.info(`${method} : ${url}`);
      logger.debug(`请求头 : ${JSON.stringify(headers)}`);
      logger.debug(`请求体 : ${JSON.stringify(body)}`);

      const res = await fetch(url, options);

      logger.info(`响应 : ${res.status} ${res.statusText}`);

      if (res.ok || res.status === 400) {
        const data = await res.json();
        logger.debug(`响应数据 : ${JSON.stringify(data)}`);
        return data;
      } else {
        throw new Error(`请求失败: ${res.status} ${res.statusText} (URL: ${url})`);
      }
    } catch (err) {
      logger.error(`错误 : ${err.message}`);
      throw err;
    }
  }
}
