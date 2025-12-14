// QuanX 重写规则（需开启）
[rewrite_local]
^https?:\/\/h5\.if\.qidian\.com\/argus\/api\/v1\/video\/adv\/finishWatch url script-request-body https://raw.githubusercontent.com/github6662/k/refs/heads/main/qqqqq.js

// 脚本内容（新建脚本文件 qidian-adv.js）
const config = {
  targetUrl: "https://h5.if.qidian.com/argus/api/v1/video/adv/finishWatch",
  taskIds: ["taskId", "taskId_2"],
  logPrefix: "[起点广告监听]",
  errorMsg: "未匹配到有效任务ID，广告福利获取失败"
};

const env = typeof $task !== "undefined" ? "quanx" : "unknown";
const storage = {
  set(key, value) {
    const data = typeof value === "object" ? JSON.stringify(value) : value;
    $prefs.setValueForKey(data, key);
  }
};

const logger = {
  info(msg) {
    console.log(`${config.logPrefix}[INFO] ${msg}`);
  },
  error(msg) {
    console.error(`${config.logPrefix}[ERROR] ${msg}`);
    $notification.post(config.logPrefix, "", msg);
  }
};

const validateTaskId = (body) => {
  try {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    return config.taskIds.some(id => data[id] && data[id].trim() !== "");
  } catch (e) {
    logger.error(`解析请求体失败：${e.message}`);
    return false;
  }
};

const main = () => {
  if (!$request) {
    logger.error("未检测到网络请求");
    return $done({});
  }
  if ($request.url !== config.targetUrl) return $done({});

  const requestData = {
    url: $request.url,
    headers: $request.headers,
    body: $request.body
  };

  if (validateTaskId(requestData.body)) {
    storage.set("qidian_adv_task_data", requestData);
    logger.info("广告任务数据存储成功");
  } else {
    logger.error(config.errorMsg);
  }
  $done({});
};

main();
