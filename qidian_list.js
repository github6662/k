/* 
🥳起点读书 - 广告列表接口（优化版）
🔗关联主脚本: qidian_main.js
[rewrite local]
https\:\/\/h5\.if\.qidian\.com\/argus\/api\/v1\/video\/adv\/mainPage url script-response-body https://raw.githubusercontent.com/github6662/k/refs/heads/main/qidian_list.js
[MITM]
hostname = h5.if.qidian.com
*/
const $ = new Env("起点读书-广告列表接口");

$.task1Count = $.getdata("qd_task1_count") ? Math.max(Number($.getdata("qd_task1_count")), 1) : 8;
$.task2Count = $.getdata("qd_task2_count") ? Math.max(Number($.getdata("qd_task2_count")), 1) : 3;

(async () => {
  try {
    const rawBody = $response.body || "{}";
    const originData = JSON.parse(rawBody);
    $.log(`📥收到原始响应 - 接口状态: ${originData.Result === 0 ? "正常" : "异常"}`);

    if (originData.Result !== 0 || !originData.Data || !originData.Data.list) {
      $.log("⚠️原始响应无效，返回默认数据");
      $.done({ body: JSON.stringify(getDefaultData()) });
      return;
    }

    const adaptedData = JSON.parse(JSON.stringify(originData));
    const taskType = judgeTaskType(adaptedData.Data.list);

    if (taskType === "task1") {
      adaptedData.Data.list = adaptTaskList(adaptedData.Data.list, $.task1Count);
      $.log(`🎯适配任务1 - 广告列表长度: ${$.task1Count}`);
    } else if (taskType === "task2") {
      adaptedData.Data.list = adaptTaskList(adaptedData.Data.list, $.task2Count);
      $.log(`🎯适配任务2 - 广告列表长度: ${$.task2Count}`);
    }

    adaptedData.Data.requestId = generateRandomStr(32);
    adaptedData.Data.timestamp = new Date().getTime();
    adaptedData.Message = "success";
    adaptedData.Result = 0;

    $.log(`🎉适配完成 - 返回处理后数据`);
    $.done({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(adaptedData)
    });
  } catch (e) {
    $.logErr("❌接口处理异常", e);
    $.done({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(getDefaultData())
    });
  }
})();

function judgeTaskType(list) {
  if (!list.length) return "unknown";
  const task1Keywords = ["每日视频福利", "阅点", "连续观看"];
  const task2Keywords = ["限时彩蛋", "惊喜", "额外奖励"];
  const firstItemTitle = (list[0].title || list[0].taskName || "").toLowerCase();
  if (task1Keywords.some(k => firstItemTitle.includes(k.toLowerCase()))) return "task1";
  if (task2Keywords.some(k => firstItemTitle.includes(k.toLowerCase()))) return "task2";
  return "unknown";
}

function adaptTaskList(originList, targetLength) {
  if (originList.length >= targetLength) return originList.slice(0, targetLength);
  const adaptedList = [...originList];
  while (adaptedList.length < targetLength) {
    const randomItem = originList[Math.floor(Math.random() * originList.length)];
    const newItem = JSON.parse(JSON.stringify(randomItem));
    newItem.id = generateRandomStr(16);
    newItem.advertId = generateRandomStr(24);
    adaptedList.push(newItem);
  }
  return adaptedList;
}

function getDefaultData() {
  return {
    Result: 0,
    Message: "success",
    Data: {
      list: [
        {
          id: generateRandomStr(16),
          advertId: generateRandomStr(24),
          title: "默认广告",
          taskName: "福利任务",
          awardNum: 1,
          awardType: 1,
          watchTime: 15,
          status: 1
        }
      ],
      requestId: generateRandomStr(32),
      timestamp: new Date().getTime()
    }
  };
}

function generateRandomStr(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}

function Env(t) {
  return new (class {
    constructor(t) {
      (this.name = t),
        (this.logs = []),
        (this.startTime = new Date().getTime()),
        this.log("", `📌${this.name} - 开始处理`);
    }
    isSurge() { return "undefined" != typeof $environment && $environment["surge-version"]; }
    isQuanX() { return "undefined" != typeof $task; }
    isLoon() { return "undefined" != typeof $loon; }
    isShadowrocket() { return "undefined" != typeof $rocket; }
    isStash() { return "undefined" != typeof $environment && $environment["stash-version"]; }
    getdata(t) {
      try {
        if (this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()) {
          return $persistentStore.read(t) || "";
        } else if (this.isQuanX()) {
          return $prefs.valueForKey(t) || "";
        }
        return "";
      } catch (e) { return ""; }
    }
    log(...t) { console.log(t.join("\n")); }
    logErr(t, s) { const errMsg = s instanceof Error ? s.message : s; this.log(`❌${this.name} - 错误: ${t}`, errMsg); }
    done(t = {}) {
      const costTime = (new Date().getTime() - this.startTime) / 1000;
      this.log(`📌${this.name} - 处理结束 | 耗时: ${costTime.toFixed(1)}s`);
      (this.isSurge() || this.isShadowrocket() || this.isQuanX() || this.isLoon() || this.isStash()) ? $done(t) : console.log("执行完成");
    }
  })(t);
}
