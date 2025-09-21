import axios from "axios";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// 如果TS报nprogress类型错误，可在项目根目录新建 types/nprogress.d.ts 文件，内容如下：
// declare module 'nprogress';

const API_PREFIX = "/api";
// 自动切换 baseURL：开发环境用本地，生产用相对路径或环境变量
const isDev = process.env.NODE_ENV === "development";
const instance = axios.create({
  baseURL: isDev ? "http://localhost:3000" : "",
  timeout: 10000,
});

// 进度条计数，防止多请求时闪烁
let requestCount = 0;

function startProgress() {
  if (requestCount === 0) NProgress.start();
  requestCount++;
}
function doneProgress() {
  requestCount = Math.max(0, requestCount - 1);
  if (requestCount === 0) NProgress.done();
}

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 只对相对路径补全 /api 前缀，绝对url不处理
    if (
      typeof config.url === "string" &&
      !config.url.startsWith("http") &&
      !config.url.startsWith(API_PREFIX)
    ) {
      config.url =
        API_PREFIX + (config.url.startsWith("/") ? "" : "/") + config.url;
    }
    startProgress();

    return config;
  },
  (error) => {
    doneProgress();

    return Promise.reject(error);
  },
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    doneProgress();

    return response;
  },
  (error) => {
    doneProgress();

    return Promise.reject(error);
  },
);

export default instance;
