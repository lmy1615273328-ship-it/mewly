import { Component, type ErrorInfo, type ReactNode } from "react";
import type React from "react";
import type { AlbumItem, CatProfile, ForumPost, HealthRecord, Page, StrayCatReport } from "./types";
import { HEALTH_DISCLAIMER } from "./types";
import type { Copy } from "./i18n";

export function Shell({
  page,
  children,
  onNavigate,
  toast,
  copy,
}: {
  page: Page;
  children: React.ReactNode;
  onNavigate: (page: Page) => void;
  toast: string;
  copy: Copy;
}) {
  const showNav = !["login", "cat-create"].includes(page);
  return (
    <div className="app-shell">
      <main className={showNav ? "screen with-tabs" : "screen"}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      {showNav && <BottomNav active={page} onNavigate={onNavigate} copy={copy} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Mewly page error", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="stack-page">
        <section className="error-card">
          <h2>页面刚刚打了个小盹</h2>
          <p>请刷新页面再试一次。如果还出现空白，可以清除本地数据或回到首页。</p>
          <small>{this.state.message}</small>
          <button className="primary-button" onClick={() => window.location.reload()}>刷新页面</button>
        </section>
      </div>
    );
  }
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="header-row">
        {back && (
          <button className="icon-button" onClick={back} aria-label="返回">
            ‹
          </button>
        )}
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}

function BottomNav({ active, onNavigate, copy }: { active: Page; onNavigate: (page: Page) => void; copy: Copy }) {
  const items: { page: Page; label: string; icon: string; match: Page[] }[] = [
    { page: "home", label: copy.nav.home, icon: "⌂", match: ["home", "profile", "settings"] },
    { page: "insight", label: copy.nav.insight, icon: "◎", match: ["insight"] },
    { page: "album", label: copy.nav.album, icon: "▧", match: ["album", "album-detail"] },
    { page: "notes", label: copy.nav.notes, icon: "✎", match: ["notes", "notes-new", "notes-result"] },
    { page: "forum", label: copy.nav.community, icon: "♡", match: ["forum", "post-new", "post-detail", "stray", "stray-new"] },
  ];
  return (
    <nav className="bottom-nav" aria-label="底部导航">
      {items.map((item) => (
        <button key={item.page} className={item.match.includes(active) ? "active" : ""} onClick={() => onNavigate(item.page)}>
          <span>{item.icon}</span>
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  );
}

export function CatCard({ cat, compact = false, status }: { cat: CatProfile; compact?: boolean; status?: string }) {
  const details = [cat.age || cat.birthday, cat.breed, cat.color, cat.weight].filter(Boolean);
  return (
    <section className={compact ? "cat-card compact-card" : "cat-card"}>
      <div className="avatar-wrap">
        <img src={cat.cartoonAvatar} alt={`${cat.name} 的卡通头像`} />
      </div>
      <div className="cat-info">
        <span className="chip warm">{cat.gender}</span>
        <h2>{cat.name}</h2>
        {!!details.length && <p>{details.join(" · ")}</p>}
        {status && <p className="cat-status">{status}</p>}
        {!!cat.personalityTags.length && <div className="tag-row">
          {cat.personalityTags.filter(Boolean).slice(0, 4).map((tag) => (
            <span className="mini-tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>}
      </div>
    </section>
  );
}

export function MoodCard({ mood, text }: { mood: string; text: string }) {
  return (
    <section className="soft-card mood-card">
      <div>
        <span className="eyebrow">今日心情</span>
        <h3>{mood}</h3>
        <p>{text}</p>
      </div>
      <div className="floating-paw"> paw </div>
    </section>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration">
        <span>∩</span>
        <strong>•ᴥ•</strong>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function PawLoader() {
  return (
    <div className="paw-loader" aria-label="加载中">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export function SegmentedTags({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="tag-grid">
      {options.map((tag) => {
        const selected = value.includes(tag);
        return (
          <button
            type="button"
            className={selected ? "tag-option selected" : "tag-option"}
            key={tag}
            onClick={() => onChange(selected ? value.filter((item) => item !== tag) : [...value, tag])}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

export function UploadPreview({
  accept,
  preview,
  onFile,
}: {
  accept: string;
  preview?: string;
  onFile: (file: File) => void;
}) {
  return (
    <label className="upload-panel">
      <input
        type="file"
        accept={accept}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      {preview ? (
        preview.startsWith("data:video") ? (
          <video src={preview} controls />
        ) : preview.startsWith("data:audio") ? (
          <audio src={preview} controls />
        ) : (
          <img src={preview} alt="上传预览" />
        )
      ) : (
        <div>
          <strong>选择照片 / 视频 / 音频</strong>
          <p>上传后会在这里预览，记录只保存在本机。</p>
        </div>
      )}
    </label>
  );
}

export function HealthRiskCard({ record }: { record: HealthRecord }) {
  return (
    <section className={`risk-card risk-${record.riskLevel}`}>
      <span className="eyebrow">健康风险分析</span>
      <h3>{record.riskLevel}</h3>
      <h4>触发原因</h4>
      <ul>{record.riskReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
      <h4>建议主人做什么</h4>
      <ul>{record.suggestions.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}

export function ForumPostCard({
  post,
  onLike,
  onOpen,
  onToggleCollect,
  onToggleFollow,
}: {
  post: ForumPost;
  onLike: () => void;
  onOpen: () => void;
  onToggleCollect: () => void;
  onToggleFollow: () => void;
}) {
  return (
    <article className="post-card">
      <div className="post-head">
        <img src={post.authorAvatar} alt="" />
        <div>
          <strong>{post.authorName}</strong>
          <p>{timeAgo(post.createdAt)}</p>
        </div>
        <button className={post.followed ? "pill active" : "pill"} onClick={onToggleFollow}>
          {post.followed ? "已关注" : "关注"}
        </button>
      </div>
      <button className="plain-block" onClick={onOpen}>
        <p>{post.content}</p>
        {!!post.mediaUrls.length && (
          <div className="media-grid">
            {post.mediaUrls.map((url) => (
              <img src={url} alt="动态图片" key={url} />
            ))}
          </div>
        )}
      </button>
      <div className="topic-row">{post.topics.map((topic) => <span key={topic}>#{topic}</span>)}</div>
      <div className="post-actions">
        <button onClick={onLike}>{post.liked ? "♥" : "♡"} {post.likeCount}</button>
        <button onClick={onOpen}>评 {post.commentCount}</button>
        <button onClick={onToggleCollect}>{post.collected ? "已藏" : "收藏"}</button>
        <button onClick={() => alert("已收到举报入口，正式版会进入人工审核。")}>举报</button>
      </div>
    </article>
  );
}

export function AlbumTile({ item, onOpen }: { item: AlbumItem; onOpen: () => void }) {
  return (
    <button className="album-tile" onClick={onOpen}>
      {item.mediaType === "video" ? <video src={item.fileUrl} /> : <img src={item.fileUrl} alt={item.note || "相册记录"} />}
      <span>{item.tags[0] || item.detectedMood || "日常"}</span>
    </button>
  );
}

export function TrendCard({ album }: { album: AlbumItem[] }) {
  const seven = album.filter((item) => Date.now() - new Date(item.createdAt).getTime() <= 7 * 86400000);
  const thirty = album.filter((item) => Date.now() - new Date(item.createdAt).getTime() <= 30 * 86400000);
  const tags = album.flatMap((item) => item.tags);
  const high = Object.entries(
    tags.reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const sleepy = tags.filter((tag) => tag === "睡觉").length;
  const bored = tags.filter((tag) => ["无聊", "生气", "生病"].includes(tag)).length;
  const advice =
    bored >= 2
      ? "最近需要多一点陪伴和观察，试试每天固定 10 分钟互动。"
      : sleepy >= 3
        ? "睡觉记录变多啦，如果同时食欲下降，请继续观察。"
        : "最近开心和玩耍记录不少，状态看起来比较轻松。";
  return (
    <section className="soft-card">
      <span className="eyebrow">状态趋势卡片</span>
      <div className="trend-grid">
        <div><strong>{seven.length}</strong><small>最近 7 天记录</small></div>
        <div><strong>{thirty.length}</strong><small>最近 30 天记录</small></div>
      </div>
      <h4>高频标签</h4>
      <div className="tag-row">
        {high.length ? high.map(([tag, count]) => <span className="mini-tag" key={tag}>{tag} {count}</span>) : <span className="mini-tag">待积累</span>}
      </div>
      <p>{advice}</p>
      <p className="notice">温柔提醒：趋势只是一份陪伴式观察，不代表医学判断。</p>
    </section>
  );
}

export function StrayCatMapCard({ report }: { report: StrayCatReport }) {
  return (
    <article className="stray-card">
      <div className="fake-map">
        <span className="map-pin">⌖</span>
        <small>{report.approximateLocation}</small>
      </div>
      <div className="stray-content">
        <strong>{report.currentStatus}</strong>
        <p>{report.description}</p>
        <div className="tag-row">
          {report.catStatusTags.map((tag) => <span className="mini-tag" key={tag}>{tag}</span>)}
          {report.needHelpTypes.map((tag) => <span className="mini-tag blue" key={tag}>{tag}</span>)}
        </div>
        <p className="notice">请温柔对待小猫，不要惊吓、捕捉或伤害。位置已做模糊化处理。</p>
        <div className="button-row">
          <button className="ghost-button">联系发布者</button>
          <button className="ghost-button" onClick={() => alert("已进入举报入口，正式版会进入人工审核。")}>举报</button>
        </div>
      </div>
    </article>
  );
}

export function Disclaimer() {
  return <p className="disclaimer">{HEALTH_DISCLAIMER}</p>;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}
