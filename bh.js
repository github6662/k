// zerobywb.com 漫画源脚本（文档合规版）- 适配 Venera 阅读器
const source = {
  // 一、基础信息（文档必填字段）
  name: "Zerobywb 漫画",
  id: "zerobywb_com",
  version: "2.0.0",
  minAppVersion: "2.0.0",
  author: "匿名",
  description: "全面适配 zerobywb.com，支持浏览/分类/搜索/阅读/收藏，兼容多语言",
  url: "http://www.zerobywb.com",
  lang: "zh-CN", // 默认语言

  // 二、全局请求配置（抗反爬+文档兼容）
  requestConfig: {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "http://www.zerobywb.com",
      "Accept-Language": "zh-CN,zh;q=0.9"
    },
    timeout: 15000,
    followRedirect: true,
    credentials: "include" // 保留 Cookie
  },

  // 三、多语言支持（文档可选）
  i18n: {
    "zh-CN": {
      browseTitle: "浏览",
      categoryTitle: "分类",
      searchTitle: "搜索",
      favoriteTitle: "我的收藏",
      latestUpdate: "最新更新",
      hotRank: "热门排行",
      sortBy: "排序方式",
      noResult: "暂无结果"
    },
    "en": {
      browseTitle: "Browse",
      categoryTitle: "Categories",
      searchTitle: "Search",
      favoriteTitle: "My Favorites",
      latestUpdate: "Latest Updates",
      hotRank: "Hot Ranking",
      sortBy: "Sort By",
      noResult: "No Results"
    }
  },

  // 四、浏览页（文档要求：支持多分页模式）
  browse: {
    pages: [
      {
        title: "{latestUpdate}", // 多语言占位符
        mode: "pagination",
        load: async (page) => {
          const res = await fetch(`${source.url}/index.php?m=comic&a=list&page=${page}`, source.requestConfig);
          const html = await res.text();
          const $ = cheerio.load(html);
          const list = [];

          // 严格适配 DOM：.list-comic li（漫画卡片）
          $(".list-comic li").each((i, el) => {
            const $el = $(el);
            const title = $el.find(".comic-name a").text().trim();
            const cover = $el.find(".comic-pic img").attr("src") || $el.find(".comic-pic img").attr("data-original");
            const detailUrl = $el.find(".comic-name a").attr("href");
            const id = detailUrl.match(/id=(\d+)/)[1] || detailUrl.split("/").pop().replace(".html", "");

            if (title && id) {
              list.push({
                id,
                title,
                cover: cover ? (cover.startsWith("http") ? cover : `${source.url}/${cover}`) : "",
                detailUrl: detailUrl.startsWith("http") ? detailUrl : `${source.url}/${detailUrl}`,
                author: $el.find(".comic-author").text().trim().replace("作者：", ""),
                tags: $el.find(".comic-tag a").map((i, t) => $(t).text().trim()).get(),
                updateTime: $el.find(".comic-time").text().trim(),
                badge: $el.find(".comic-badge").text().trim() || ""
              });
            }
          });

          return { list, hasMore: list.length >= 24 }; // 文档要求返回 {list, hasMore}
        }
      },
      {
        title: "{hotRank}",
        mode: "pagination",
        load: async (page) => {
          const res = await fetch(`${source.url}/index.php?m=comic&a=rank&page=${page}`, source.requestConfig);
          const html = await res.text();
          const $ = cheerio.load(html);
          const list = [];

          $(".list-comic li").each((i, el) => {
            // 复用解析逻辑
            const $el = $(el);
            const title = $el.find(".comic-name a").text().trim();
            const cover = $el.find(".comic-pic img").attr("src") || $el.find(".comic-pic img").attr("data-original");
            const detailUrl = $el.find(".comic-name a").attr("href");
            const id = detailUrl.match(/id=(\d+)/)[1] || detailUrl.split("/").pop().replace(".html", "");

            if (title && id) {
              list.push({
                id,
                title,
                cover: cover ? (cover.startsWith("http") ? cover : `${source.url}/${cover}`) : "",
                detailUrl: detailUrl.startsWith("http") ? detailUrl : `${source.url}/${detailUrl}`,
                author: $el.find(".comic-author").text().trim().replace("作者：", ""),
                hot: $el.find(".comic-hot").text().trim() || "0"
              });
            }
          });

          return { list, hasMore: list.length >= 24 };
        }
      }
    ]
  },

  // 五、分类页（文档要求：load返回分类列表，loadComics返回分类漫画）
  categories: {
    load: async () => {
      const res = await fetch(`${source.url}/index.php?m=comic&a=category`, source.requestConfig);
      const html = await res.text();
      const $ = cheerio.load(html);
      const categories = [];

      // 动态爬取网站分类（文档支持固定/动态）
      $(".category-list a").each((i, el) => {
        const name = $(el).text().trim();
        const url = $(el).attr("href");
        const id = url.match(/cid=(\d+)/)[1];

        if (name && id && !name.includes("全部")) {
          categories.push({ id, name });
        }
      });

      return categories; // 文档要求返回数组 [{id, name}]
    },
    loadComics: async (categoryId, page, sort = "update") => {
      const sortMap = { update: "time", hot: "hits", score: "score" };
      const res = await fetch(
        `${source.url}/index.php?m=comic&a=list&cid=${categoryId}&order=${sortMap[sort]}&page=${page}`,
        source.requestConfig
      );
      const html = await res.text();
      const $ = cheerio.load(html);
      const list = [];

      $(".list-comic li").each((i, el) => {
        const $el = $(el);
        const title = $el.find(".comic-name a").text().trim();
        const cover = $el.find(".comic-pic img").attr("src") || $el.find(".comic-pic img").attr("data-original");
        const detailUrl = $el.find(".comic-name a").attr("href");
        const id = detailUrl.match(/id=(\d+)/)[1] || detailUrl.split("/").pop().replace(".html", "");

        if (title && id) {
          list.push({
            id,
            title,
            cover: cover ? (cover.startsWith("http") ? cover : `${source.url}/${cover}`) : "",
            detailUrl: detailUrl.startsWith("http") ? detailUrl : `${source.url}/${detailUrl}`,
            author: $el.find(".comic-author").text().trim().replace("作者：", ""),
            updateTime: $el.find(".comic-time").text().trim()
          });
        }
      });

      return { list, hasMore: list.length >= 24 };
    }
  },

  // 六、搜索功能（文档要求：支持排序，返回分页结果）
  search: {
    supportSort: true,
    sorts: [
      { id: "update", name: "最新更新" },
      { id: "hot", name: "热门优先" },
      { id: "relevant", name: "相关度" }
    ],
    load: async (keyword, page, sort = "relevant") => {
      const sortParam = sort === "relevant" ? "like" : (sort === "hot" ? "hits" : "time");
      const res = await fetch(
        `${source.url}/index.php?m=comic&a=search&keyword=${encodeURIComponent(keyword)}&order=${sortParam}&page=${page}`,
        source.requestConfig
      );
      const html = await res.text();
      const $ = cheerio.load(html);
      const list = [];

      $(".list-comic li").each((i, el) => {
        const $el = $(el);
        const title = $el.find(".comic-name a").text().trim();
        const cover = $el.find(".comic-pic img").attr("src") || $el.find(".comic-pic img").attr("data-original");
        const detailUrl = $el.find(".comic-name a").attr("href");
        const id = detailUrl.match(/id=(\d+)/)[1] || detailUrl.split("/").pop().replace(".html", "");

        if (title && id) {
          list.push({
            id,
            title,
            cover: cover ? (cover.startsWith("http") ? cover : `${source.url}/${cover}`) : "",
            detailUrl: detailUrl.startsWith("http") ? detailUrl : `${source.url}/${detailUrl}`,
            author: $el.find(".comic-author").text().trim().replace("作者：", ""),
            tags: $el.find(".comic-tag a").map((i, t) => $(t).text().trim()).get()
          });
        }
      });

      return { list, hasMore: list.length >= 24 };
    }
  },

  // 七、漫画详情（文档要求：返回完整漫画信息+章节列表）
  detail: {
    load: async (id) => {
      const res = await fetch(`${source.url}/index.php?m=comic&a=detail&id=${id}`, source.requestConfig);
      const html = await res.text();
      const $ = cheerio.load(html);

      // 解析详情（文档要求包含核心字段）
      return {
        id,
        title: $(".comic-detail-title").text().trim(),
        cover: $(".comic-detail-cover img").attr("src") 
          ? ($(".comic-detail-cover img").attr("src").startsWith("http") ? $(".comic-detail-cover img").attr("src") : `${source.url}/${$(".comic-detail-cover img").attr("src")}`)
          : "",
        author: $(".comic-detail-author").text().trim().replace("作者：", ""),
        tags: $(".comic-detail-tags a").map((i, t) => $(t).text().trim()).get(),
        description: $(".comic-detail-desc").text().trim() || "暂无简介",
        status: $(".comic-detail-status").text().trim().replace("状态：", ""),
        score: $(".comic-detail-score").text().trim() || "0",
        updateTime: $(".comic-detail-update").text().trim().replace("最后更新：", ""),
        chapters: $(".chapter-list li").map((i, el) => {
          const $el = $(el);
          const chapterTitle = $el.find("a").text().trim();
          const chapterUrl = $el.find("a").attr("href");
          const chapterId = chapterUrl.match(/cid=(\d+)/)[1] || chapterUrl.split("/").pop().replace(".html", "");
          return {
            id: chapterId,
            title: chapterTitle,
            url: chapterUrl.startsWith("http") ? chapterUrl : `${source.url}/${chapterUrl}`,
            updateTime: $el.find(".chapter-time").text().trim(),
            isFree: !$el.find(".chapter-vip").length // 是否免费
          };
        }).get().reverse(), // 最新章节在尾
        comments: await source.comment.loadComicComments(id, 1) // 关联评论功能
      };
    }
  },

  // 八、章节图片加载（文档核心：返回图片数组）
  chapter: {
    load: async (chapterUrl) => {
      const res = await fetch(chapterUrl, source.requestConfig);
      const html = await res.text();
      const $ = cheerio.load(html);

      // 处理懒加载图片（data-src）
      const images = $(".chapter-content img").map((i, el) => {
        let imgSrc = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-original");
        return imgSrc ? (imgSrc.startsWith("http") ? imgSrc : `${source.url}/${imgSrc}`) : "";
      }).get().filter(src => src); // 过滤空链接

      return { images }; // 文档要求返回 {images}
    }
  },

  // 九、收藏管理（文档可选：支持增删改查）
  favorite: {
    add: async (comicId, folderId = "default") => {
      // 本地存储模拟（实际可对接网站收藏接口）
      const favorites = JSON.parse(localStorage.getItem("zerobywb_favorites") || "{}");
      if (!favorites[folderId]) favorites[folderId] = [];
      if (!favorites[folderId].includes(comicId)) favorites[folderId].push(comicId);
      localStorage.setItem("zerobywb_favorites", JSON.stringify(favorites));
      return true;
    },
    remove: async (comicId, folderId = "default") => {
      const favorites = JSON.parse(localStorage.getItem("zerobywb_favorites") || "{}");
      if (favorites[folderId]) {
        favorites[folderId] = favorites[folderId].filter(id => id !== comicId);
        localStorage.setItem("zerobywb_favorites", JSON.stringify(favorites));
      }
      return true;
    },
    getFolders: async () => {
      return [
        { id: "default", name: "默认收藏夹" },
        { id: "hot", name: "热门收藏" }
      ];
    },
    load: async (folderId = "default", page) => {
      const favorites = JSON.parse(localStorage.getItem("zerobywb_favorites") || "{}");
      const comicIds = favorites[folderId] || [];
      const pageSize = 20;
      const start = (page - 1) * pageSize;
      const pageIds = comicIds.slice(start, start + pageSize);

      // 批量获取收藏漫画详情
      const list = await Promise.all(pageIds.map(async (id) => {
        const detail = await source.detail.load(id);
        return {
          id: detail.id,
          title: detail.title,
          cover: detail.cover,
          detailUrl: detail.detailUrl,
          author: detail.author
        };
      }));

      return { list, hasMore: start + pageSize < comicIds.length };
    }
  },

  // 十、评论功能（文档可选：支持漫画/章节评论）
  comment: {
    loadComicComments: async (comicId, page) => {
      const res = await fetch(`${source.url}/index.php?m=comment&a=list&comic_id=${comicId}&page=${page}`, source.requestConfig);
      const html = await res.text();
      const $ = cheerio.load(html);
      const comments = [];

      // 解析评论（文档支持富文本，仅允许指定标签）
      $(".comment-item").each((i, el) => {
        const $el = $(el);
        comments.push({
          id: $el.attr("data-id") || `comment_${i}`,
          username: $el.find(".comment-username").text().trim(),
          avatar: $el.find(".comment-avatar img").attr("src") || "",
          content: $el.find(".comment-content").html() || "", // 保留允许的HTML标签
          time: $el.find(".comment-time").text().trim(),
          likeCount: $el.find(".comment-like").text().trim() || "0"
        });
      });

      return { comments, hasMore: comments.length >= 10 };
    },
    loadChapterComments: async (chapterId, page) => {
      // 章节评论逻辑（同漫画评论）
      const res = await fetch(`${source.url}/index.php?m=comment&a=list&chapter_id=${chapterId}&page=${page}`, source.requestConfig);
      const html = await res.text();
      const $ = cheerio.load(html);
      const comments = [];

      $(".comment-item").each((i, el) => {
        const $el = $(el);
        comments.push({
          id: $el.attr("data-id") || `chapter_comment_${i}`,
          username: $el.find(".comment-username").text().trim(),
          content: $el.find(".comment-content").html() || "",
          time: $el.find(".comment-time").text().trim()
        });
      });

      return { comments, hasMore: comments.length >= 10 };
    }
  },

  // 十一、设置项（文档可选：支持多种配置类型）
  settings: [
    {
      id: "imageQuality",
      name: "图片质量",
      type: "select",
      options: [
        { id: "high", name: "高清" },
        { id: "medium", name: "标清" },
        { id: "low", name: "流畅" }
      ],
      defaultValue: "high",
      onChange: (value) => {
        console.log("图片质量设置为：", value);
        // 可添加质量切换逻辑（如修改图片URL参数）
      }
    },
    {
      id: "autoLoadNext",
      name: "自动加载下一章",
      type: "switch",
      defaultValue: true,
      onChange: (value) => {
        console.log("自动加载下一章：", value);
      }
    },
    {
      id: "customUA",
      name: "自定义User-Agent",
      type: "input",
      defaultValue: source.requestConfig.headers["User-Agent"],
      onChange: (value) => {
        source.requestConfig.headers["User-Agent"] = value;
      }
    }
  ]
};

// 文档要求：必须导出 source 对象
module.exports = source;
