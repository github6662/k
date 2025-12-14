/* 
📌脚本功能: 获取起点读书广告会话信息
触发方式: 我 → 福利中心 → 手动观看任意一个广告
重写配置:
[rewrite local]
https://h5.if.qidian.com/argus/api/v1/video/adv/finishWatch url script-request-body https://raw.githubusercontent.com/github6662/k/refs/heads/main/qd.js
[MITM]
hostname = h5.if.qidian.com
*/
const $ = new Env("起点读书-广告信息获取");

// 读取已获取的TaskId
const taskId1 = $.getdata("qd_taskId");
const taskId2 = $.getdata("qd_taskId_2");

if (!taskId1 || !taskId2) {
  $.log("⚠️未获取到任务ID，请先执行任务信息获取脚本");
  $.msg($.name, "获取失败", "未获取到任务ID，请先执行任务信息获取脚本");
  $.done();
}

// 解析请求信息
try {
  const session = {
    url: $request.url,
    body: $request.body,
    headers: $request.headers
  };
  // 精准匹配TaskId（避免误判）
  const isTask1 = new RegExp(`"TaskId":"?${taskId1}"?`).test(session.body);
  const isTask2 = new RegExp(`"TaskId":"?${taskId2}"?`).test(session.body);

  if (isTask1) {
    saveSession(session, "qd_session", "广告1");
  } else if (isTask2) {
    saveSession(session, "qd_session_2", "广告2");
  } else {
    throw new Error("未匹配到任务ID");
  }
} catch (err) {
  $.logErr(`🔴获取失败: ${err.message}`);
  $.msg($.name, "获取失败", err.message);
} finally {
  $.done();
}

// 保存会话信息
function saveSession(session, key, name) {
  if (!session.url || !session.headers) {
    $.logErr(`🔴${name}会话信息无效`);
    $.msg($.name, "获取失败", `${name}会话信息无效`);
    return;
  }
  const sessionStr = JSON.stringify(session);
  if ($.setdata(sessionStr, key)) {
    $.log(`🎉${name}信息获取成功`);
    $.msg($.name, "获取成功", `${name}会话信息已保存`);
  } else {
    $.logErr(`🔴${name}信息保存失败`);
    $.msg($.name, "获取失败", `${name}信息保存失败`);
  }
}

// 同主脚本的简化版Env类（直接复制）
function Env(name) { /* 与qidian.js一致，此处省略重复代码 */ }
