# 基础防检测请求头（模拟人类浏览器，契合 Botasaurus 指纹伪装）
[MITM]
hostname = *.omkar.cloud, *.yahoo.com, *.stackoverflow.com, *.g2.com, *.moralstories26.com, *.cloudflare.com, *.nopecha.com, *.fingerprint.com, *.datadome.co
skip-cert-verify = true

[Rewrite]
# 注入核心请求头参数
^https?://.*$ header-replace User-Agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.37"
^https?://.*$ header-replace Referer "https://www.google.com/"
^https?://.*$ header-replace Accept "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
^https?://.*$ header-replace Accept-Encoding "gzip, deflate, br"
^https?://.*$ header-replace Accept-Language "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7"
^https?://.*$ header-add Sec-CH-UA "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\""
^https?://.*$ header-add Sec-CH-UA-Mobile "?0"
^https?://.*$ header-add Sec-CH-UA-Platform "\"Windows\""
^https?://.*$ header-add Sec-Fetch-Dest "document"
^https?://.*$ header-add Sec-Fetch-Mode "navigate"
^https?://.*$ header-add Sec-Fetch-Site "same-origin"
^https?://.*$ header-add Sec-Fetch-User "?1"
^https?://.*$ header-add Upgrade-Insecure-Requests "1"

[Filter]
# 1. 放行核心目标站点（按需替换为实际爬取域名）
DOMAIN-SUFFIX,omkar.cloud,DIRECT
DOMAIN-SUFFIX,yahoo.com,DIRECT
DOMAIN-SUFFIX,stackoverflow.com,DIRECT
DOMAIN-SUFFIX,g2.com,DIRECT
DOMAIN-SUFFIX,moralstories26.com,DIRECT

# 2. 绕过反爬验证站点（适配 Botasaurus 防检测机制）
DOMAIN-SUFFIX,cloudflare.com,DIRECT
DOMAIN-SUFFIX,nopecha.com,DIRECT
DOMAIN-SUFFIX,fingerprint.com,DIRECT
DOMAIN-SUFFIX,datadome.co,DIRECT

# 3. 屏蔽冗余资源（同 Botasaurus 资源屏蔽功能，节省带宽）
URL-REGEX,.*\.(png|jpg|jpeg|gif|svg|css|woff2?|ttf|eot),REJECT
URL-REGEX,.*ad\.|.*analytics\.|.*tracker\.|.*pixel\.|.*stats\.|.*log\.|.*beacon\.|.*collect\.|.*chat\.|.*popup\.|.*overlay\.|.*banner\.|.*promo\.|.*sponsor\.|.*affiliate\.|.*redirect\.|.*click\.|.*marketing\.|.*advertise\.|.*video\.|.*audio\.|.*stream\.|.*download\.|.*file\.|.*attachment\.|.*pdf\.|.*zip\.|.*rar\.|.*exe\.|.*apk,REJECT

# 4. 爬虫专属代理配置（支持 Botasaurus 代理池/IP 轮转）
DOMAIN-KEYWORD,botasaurus,PROXY
IP-CIDR,0.0.0.0/0,PROXY  # 所有爬虫请求走专属代理（按需调整）
