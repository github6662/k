/*
脚本名称: 起点读书-全能脚本 (All-in-One)
脚本作者: @github-666 (由 AI 优化整合)
脚本功能:
  - 自动获取任务ID
  - 自动获取广告请求信息
  - 自动执行观看广告任务
使用说明:
  - 此脚本整合了获取信息和执行任务的所有功能。
  - 根据运行环境，脚本会自动判断执行何种操作：
    1. 如果是 MitM 环境下捕获特定 URL，则会获取信息。
    2. 如果是定时任务环境，则会执行观看广告。
*/

const $ = new Env("起点读书-全能版");

// --- 脚本模式定义 ---
const ScriptMode = {
    UNKNOWN: 0,
    GET_TASK_ID: 1,       // 获取任务ID (对应 qd2.js)
    GET_AD_SESSION: 2,    // 获取广告会话 (对应 qd.js)
    RUN_TASKS: 3          // 执行定时任务 (对应 qidian.js)
};

// --- 核心业务逻辑 ---

// 模式1: 获取任务ID
async function getTaskId() {
    $.log("ℹ️ 模式: 获取任务ID");
    try {
        const body = $response.body;
        if (!body) throw new Error("响应体为空。");
        
        const obj = JSON.parse(body);
        const videoTasks = obj?.Data?.VideoBenefitModule?.TaskList;
        const countdownTasks = obj?.Data?.CountdownBenefitModule?.TaskList;

        if (!videoTasks || !countdownTasks) throw new Error("响应数据中缺少任务列表。");

        const mainTaskId = videoTasks[0]?.TaskId;
        const extraTask = countdownTasks.find(task => task.Title === "额外看3次小视频得奖励");
        const extraTaskId = extraTask?.TaskId;

        if (mainTaskId && extraTaskId) {
            $.setdata(mainTaskId, "qd_taskId");
            $.setdata(extraTaskId, "qd_taskId_2");
            const message = `✅ 任务ID 1: ${mainTaskId}\n✅ 任务ID 2: ${extraTaskId}`;
            $.log("🎉 任务信息获取成功!");
            $.log(message);
            $.msg($.name, "🎉 任务信息获取成功!", "现在可以禁用此重写。");
        } else {
            throw new Error("未能从响应中找到所需的任务ID。");
        }
    } catch (error) {
        $.log(`🔴 处理响应时发生错误: ${error.message}`);
        $.msg($.name, "🔴 任务信息获取失败!", "请检查重写规则和App响应。");
    }
}

// 模式2: 获取广告会话
async function getAdSession() {
    $.log("ℹ️ 模式: 获取广告会话");
    try {
        const taskId = $.getdata("qd_taskId");
        const taskId_2 = $.getdata("qd_taskId_2");

        if (!taskId || !taskId_2) {
            $.msg($.name, "⚠️ 请先获取任务ID", "请先进入福利中心页面以捕获任务ID。");
            return;
        }

        const session = {
            url: $request.url,
            body: $request.body,
            headers: $request.headers,
        };
        delete session.headers.Cookie;
        const sessionStr = JSON.stringify(session);
        
        if (session.body.includes(taskId)) {
            $.setdata(sessionStr, "qd_session");
            $.log("✅ 广告信息 1 获取成功!");
            $.msg($.name, "🎉 广告信息 1 获取成功!", "现在可以禁用此重写。");
        } else if (session.body.includes(taskId_2)) {
            $.setdata(sessionStr, "qd_session_2");
            $.log("✅ 广告信息 2 获取成功!");
            $.msg($.name, "🎉 广告信息 2 获取成功!", "现在可以禁用此重写。");
        } else {
            $.log("🔴 未能匹配到任务ID，无法保存广告信息。");
        }
    } catch (error) {
        $.log(`🔴 获取广告会话时发生错误: ${error.message}`);
        $.msg($.name, "🔴 广告信息获取失败", "请检查脚本配置。");
    }
}

// 模式3: 执行定时任务
async function runTasks() {
    $.log("ℹ️ 模式: 执行定时任务");
    const config = {
        session: $.getdata("qd_session"),
        session_2: $.getdata("qd_session_2"),
        timeout: parseInt($.getdata("qd_timeout"), 10) || 20,
    };

    if (!config.session || !config.session_2) {
        $.msg($.name, "🔴 配置不完整", "缺少广告会话信息，请通过重写捕获。");
        return;
    }

    const execute = async (session, count, taskName) => {
        $.log(`--- 开始执行 [${taskName}] ---`);
        for (let i = 0; i < count; i++) {
            $.log(`🟡 [${taskName}] 执行第 ${i + 1}/${count} 次...`);
            try {
                const options = JSON.parse(session);
                const resp = await $.http.post(options);
                const result = JSON.parse(resp.body);
                if (result.Result === 0) $.log("✅ 执行成功!");
                else $.log(`🔴 执行失败: ${resp.body}`);
            } catch (e) {
                $.log(`🔴 执行请求时出错: ${e}`);
            }
            if (i < count - 1) {
                $.log(`⏳ 等待 ${config.timeout} 秒...`);
                await $.wait(config.timeout * 1000);
            }
        }
        $.log(`--- [${taskName}] 执行完毕 ---`);
    };

    await execute(config.session, 8, "广告任务1");
    await execute(config.session_2, 3, "广告任务2");
}

// --- 主函数：判断脚本模式并执行 ---
(async () => {
    let mode = ScriptMode.RUN_TASKS; // 默认为执行任务模式
    
    // 如果在 MitM 环境下 ($request 存在)
    if (typeof $request !== 'undefined' && $request.url) {
        const url = $request.url;
        if (url.includes("/v1/user/GetBenefitTask")) {
            mode = ScriptMode.GET_TASK_ID;
        } else if (url.includes("/v2/user/GetBenefitTaskUrl")) {
            mode = ScriptMode.GET_AD_SESSION;
        }
    }

    switch (mode) {
        case ScriptMode.GET_TASK_ID:
            await getTaskId();
            break;
        case ScriptMode.GET_AD_SESSION:
            await getAdSession();
            break;
        case ScriptMode.RUN_TASKS:
            await runTasks();
            break;
        default:
            $.log("🔴 未知模式，脚本退出。");
            break;
    }
})()
.catch((e) => $.logErr(e))
.finally(() => {
    $.log("🏁 脚本执行结束。");
    $.done();
});


// -----------------------------------------------------------------
// Env 环境类 (无需修改)
// -----------------------------------------------------------------
function Env(t, e) {
    "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0);
    class s {
        constructor(t) {
            this.env = t
        }
        send(t, e = "GET") {
            t = "string" == typeof t ? {
                url: t
            } : t;
            let s = this.get;
            return "POST" === e && (s = this.post), new Promise((e, i) => {
                s.call(this, t, (t, s, r) => {
                    t ? i(t) : e(s)
                })
            })
        }
        get(t) {
            return this.send.call(this.env, t)
        }
        post(t) {
            return this.send.call(this.env, t, "POST")
        }
    }
    return new class {
        constructor(t, e) {
            this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`)
        }
        isNode() {
            return "undefined" != typeof module && !!module.exports
        }
        isQuanX() {
            return "undefined" != typeof $task
        }
        isSurge() {
            return "undefined" != typeof $httpClient && "undefined" == typeof $loon
        }
        isLoon() {
            return "undefined" != typeof $loon
        }
        toObj(t, e = null) {
            try {
                return JSON.parse(t)
            } catch {
                return e
            }
        }
        toStr(t, e = null) {
            try {
                return JSON.stringify(t)
            } catch {
                return e
            }
        }
        getjson(t, e) {
            let s = e;
            const i = this.getdata(t);
            if (i) try {
                s = JSON.parse(this.getdata(t))
            } catch {}
            return s
        }
        setjson(t, e) {
            try {
                return this.setdata(JSON.stringify(t), e)
            } catch {
                return !1
            }
        }
        getScript(t) {
            return new Promise(e => {
                this.get({
                    url: t
                }, (t, s, i) => e(i))
            })
        }
        runScript(t, e) {
            return new Promise(s => {
                let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, "").trim() : i;
                let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r;
                const [o, h] = i.split("@"), a = {
                    url: `http://${h}/v1/scripting/evaluate`,
                    body: {
                        script_text: t,
                        mock_type: "cron",
                        timeout: r
                    },
                    headers: {
                        "X-Key": o,
                        Accept: "*/*"
                    }
                };
                this.post(a, (t, e, i) => s(i))
            }).catch(t => this.logErr(t))
        }
        loaddata() {
            if (!this.isNode()) return {}; {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e);
                if (!s && !i) return {}; {
                    const i = s ? t : e;
                    try {
                        return JSON.parse(this.fs.readFileSync(i))
                    } catch (t) {
                        return {}
                    }
                }
            }
        }
        writedata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e),
                    r = JSON.stringify(this.data);
                s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
            }
        }
        lodash(t, e) {
            const s = this.getdata(t);
            if (s) try {
                return JSON.parse(s)
            } catch {}
            return e
        }
        getdata(t) {
            let e = this.getval(t);
            if (/^@/.test(t)) {
                const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getdata(s) : "";
                if (r) try {
                    const t = JSON.parse(r);
                    e = t ? t[i] : ""
                } catch (t) {
                    e = ""
                }
            }
            return e
        }
        setdata(t, e) {
            let s = !1;
            if (/^@/.test(e)) {
                const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getdata(i), h = i ? "object" == typeof o ? o : {} : this.data;
                h[r] = t, s = this.setval(JSON.stringify(h), i)
            } else s = this.setval(t, e);
            return s
        }
        getval(t) {
            return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
        }
        setval(t, e) {
            return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
        }
        initGotEnv(t) {
            this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
        }
        get(t, e = (() => {})) {
            t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                "X-Surge-Skip-Scripting": !1
            })), $httpClient.get(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                hints: !1
            })), $task.fetch(t).then(t => {
                const {
                    statusCode: s,
                    statusCode: i,
                    headers: r,
                    body: o
                } = t;
                e(null, {
                    status: s,
                    statusCode: i,
                    headers: r,
                    body: o
                }, o)
            }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
                try {
                    if (t.headers["set-cookie"]) {
                        const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                        this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar
                    }
                } catch (t) {
                    this.logErr(t)
                }
            }).then(t => {
                const {
                    statusCode: s,
                    statusCode: i,
                    headers: r,
                    body: o
                } = t;
                e(null, {
                    status: s,
                    statusCode: i,
                    headers: r,
                    body: o
                }, o)
            }, t => {
                const {
                    message: s,
                    response: i
                } = t;
                e(s, i, i && i.body)
            }))
        }
        post(t, e = (() => {})) {
            if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                "X-Surge-Skip-Scripting": !1
            })), $httpClient.post(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            });
            else if (this.isQuanX()) t.opts = t.opts || {}, this.isNeedRewrite && Object.assign(t.opts, {
                hints: !1
            }), $task.fetch(t).then(t => {
                const {
                    statusCode: s,
                    statusCode: i,
                    headers: r,
                    body: o
                } = t;
                e(null, {
                    status: s,
                    statusCode: i,
                    headers: r,
                    body: o
                }, o)
            }, t => e(t));
            else if (this.isNode()) {
                this.initGotEnv(t);
                const {
                    url: s,
                    ...i
                } = t;
                this.got.post(s, i).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => {
                    const {
                        message: s,
                        response: i
                    } = t;
                    e(s, i, i && i.body)
                })
            }
        }
        time(t) {
            let e = {
                "M+": (new Date).getMonth() + 1,
                "d+": (new Date).getDate(),
                "H+": (new Date).getHours(),
                "m+": (new Date).getMinutes(),
                "s+": (new Date).getSeconds(),
                "q+": Math.floor(((new Date).getMonth() + 3) / 3),
                S: (new Date).getMilliseconds()
            };
            /(y+)/.test(t) && (t = t.replace(RegExp.$1, ((new Date).getFullYear() + "").substr(4 - RegExp.$1.length)));
            for (let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr(("" + e[s]).length)));
            return t
        }
        msg(e = t, s = "", i = "", r) {
            const o = t => {
                if (!t) return;
                if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? {
                    "open-url": t
                } : this.isSurge() ? {
                    url: t
                } : void 0;
                if ("object" == typeof t) {
                    if (this.isLoon()) {
                        let e = t.openUrl || t.url || t["open-url"],
                            s = t.mediaUrl || t["media-url"];
                        return {
                            openUrl: e,
                            mediaUrl: s
                        }
                    }
                    if (this.isQuanX()) {
                        let e = t["open-url"] || t.url || t.openUrl,
                            s = t["media-url"] || t.mediaUrl;
                        return {
                            "open-url": e,
                            "media-url": s
                        }
                    }
                    if (this.isSurge()) {
                        let e = t.url || t.openUrl || t["open-url"];
                        return {
                            url: e
                        }
                    }
                }
            };
            this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r)));
            let h = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];
            h.push(e), s && h.push(s), i && h.push(i), this.log(h.join("\n")), this.logs = []
        }
        log(...t) {
            t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator))
        }
        logErr(t, e) {
            const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t)
        }
        wait(t) {
            return new Promise(e => setTimeout(e, t))
        }
        done(t = {}) {
            const e = (new Date).getTime(),
                s = (e - this.startTime) / 1e3;
            this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
        }
    }(t, e)
}
