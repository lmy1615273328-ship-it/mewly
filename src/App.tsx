import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlbumTile,
  CatCard,
  Disclaimer,
  EmptyState,
  ForumPostCard,
  HealthRiskCard,
  MoodCard,
  PageHeader,
  PawLoader,
  SegmentedTags,
  Shell,
  StrayCatMapCard,
  TrendCard,
  UploadPreview,
} from "./components";
import { behaviorTagGroups, sceneOptions, soundBehaviorTags, interactionBehaviorTags } from "./data/catBehaviorKnowledge";
import { analyzeCatBehavior, analyzeCatMediaWithAI, type CatBehaviorAnalysisResult } from "./lib/analyzeCatBehavior";
import { generateCatAvatar } from "./avatar";
import { analyzeHealthRisk } from "./healthRisk";
import { emptyData, fileToDataUrl, loadData, makeId, nowIso, saveData } from "./storage";
import { interpolate, saveLanguage, text } from "./i18n";
import type { Copy } from "./i18n";
import type {
  AlbumItem,
  AppData,
  CatProfile,
  ForumPost,
  Gender,
  HealthRecord,
  MediaAnalysis,
  MediaType,
  Page,
  Severity,
  StrayCatReport,
  User,
} from "./types";
import { APP_NAME, APP_VERSION, type Language } from "./types";

const personalityOptions = ["胆小", "粘人", "活泼", "高冷", "爱叫", "爱玩", "怕生"];
const albumTags = ["睡觉", "吃饭", "玩耍", "撒娇", "生气", "生病", "搞怪", "成长记录", "无聊", "开心"];
const abnormalOptions = [
  "呕吐",
  "软便 / 拉稀 / 便秘",
  "不爱吃饭",
  "不喝水",
  "频繁喝水",
  "精神差",
  "郁郁寡欢",
  "躲起来",
  "频繁舔毛",
  "掉毛严重",
  "咳嗽 / 打喷嚏",
  "眼睛分泌物",
  "走路异常",
  "频繁进猫砂盆",
  "乱尿",
  "攻击性变强",
];
const forumTopics = ["新手养猫", "猫咪健康", "猫咪日常", "领养代替购买", "猫咪用品", "猫咪搞笑瞬间"];
const strayStatusTags = ["健康", "受伤", "怀孕", "幼猫", "怕人", "亲人", "需要救助"];
const helpTypes = ["领养", "救助", "喂养", "绝育帮助"];

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [page, setPage] = useState<Page>(() => (loadData().user ? (loadData().cat ? "home" : "cat-create") : "login"));
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [selectedHealthId, setSelectedHealthId] = useState("");
  const copy = text[data.language || "zh-CN"];

  useEffect(() => saveData(data), [data]);
  useEffect(() => {
    document.title = APP_NAME;
    document.documentElement.lang = data.language === "en" ? "en" : "zh-CN";
  }, [data.language]);

  function patch(updater: (prev: AppData) => AppData) {
    setData((prev) => updater(prev));
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  function go(next: Page) {
    if (!data.user && next !== "login") {
      setPage("login");
      return;
    }
    if (data.user && !data.cat && next !== "cat-create" && next !== "settings" && next !== "profile") {
      setPage("cat-create");
      return;
    }
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const selectedAlbum = data.album.find((item) => item.id === selectedAlbumId);
  const selectedPost = data.forumPosts.find((item) => item.id === selectedPostId);
  const selectedHealth = data.healthRecords.find((item) => item.id === selectedHealthId) ?? data.healthRecords[0];

  let content: React.ReactNode;
  if (page === "login") content = <LoginPage copy={copy} onLogin={(user) => { patch((prev) => ({ ...prev, user })); setPage("cat-create"); notify("喵～欢迎回来"); }} onDemo={(next) => { setData({ ...next, language: data.language }); setPage("home"); notify("演示账号已准备好"); }} />;
  else if (page === "cat-create") content = <CatCreatePage copy={copy} user={data.user!} onSave={(cat) => { patch((prev) => ({ ...prev, cat })); go("home"); notify("喵～猫咪资料建好啦"); }} />;
  else if (!data.user || !data.cat) content = <LoginPage copy={copy} onLogin={() => undefined} onDemo={() => undefined} />;
  else if (page === "home") content = <HomePage data={data} go={go} />;
  else if (page === "insight") content = <InsightPage copy={copy} data={data} loading={loading} setLoading={setLoading} onSave={(analysis) => { patch((prev) => ({ ...prev, analyses: [analysis, ...prev.analyses], user: bumpUsage(prev.user) })); notify("喵～分析完成啦"); }} />;
  else if (page === "album") content = <AlbumPage copy={copy} data={data} onOpen={(id) => { setSelectedAlbumId(id); go("album-detail"); }} onSave={(item) => { patch((prev) => ({ ...prev, album: [item, ...prev.album], user: bumpUsage(prev.user) })); notify("喵～照片收进相册啦"); }} />;
  else if (page === "album-detail") content = <AlbumDetailPage item={selectedAlbum} onBack={() => go("album")} onDelete={(id) => { if (confirm("确定删除这条相册记录吗？")) { patch((prev) => ({ ...prev, album: prev.album.filter((item) => item.id !== id) })); go("album"); notify("已删除这条记录"); } }} />;
  else if (page === "notes") content = <NotesPage copy={copy} records={data.healthRecords} go={go} onOpen={(id) => { setSelectedHealthId(id); go("notes-result"); }} />;
  else if (page === "notes-new") content = <NotesNewPage copy={copy} userId={data.user.id} catId={data.cat.id} onBack={() => go("notes")} onSave={(record) => { patch((prev) => ({ ...prev, healthRecords: [record, ...prev.healthRecords], user: bumpUsage(prev.user) })); setSelectedHealthId(record.id); go("notes-result"); notify("喵～健康记录好啦"); }} />;
  else if (page === "notes-result") content = <NotesResultPage copy={copy} record={selectedHealth} onBack={() => go("notes")} />;
  else if (page === "forum") content = <ForumPage copy={copy} data={data} go={go} posts={data.forumPosts} onNew={() => go("post-new")} onOpen={(id) => { setSelectedPostId(id); go("post-detail"); }} updatePost={(id, fn) => patch((prev) => ({ ...prev, forumPosts: prev.forumPosts.map((post) => post.id === id ? fn(post) : post) }))} />;
  else if (page === "post-new") content = <PostNewPage user={data.user} onBack={() => go("forum")} onSave={(post) => { patch((prev) => ({ ...prev, forumPosts: [post, ...prev.forumPosts], user: bumpUsage(prev.user) })); go("forum"); notify("喵～动态发布啦"); }} />;
  else if (page === "post-detail") content = <PostDetailPage post={selectedPost} comments={data.comments.filter((c) => c.postId === selectedPost?.id)} user={data.user} onBack={() => go("forum")} onComment={(comment) => { patch((prev) => ({ ...prev, comments: [comment, ...prev.comments], forumPosts: prev.forumPosts.map((post) => post.id === comment.postId ? { ...post, commentCount: post.commentCount + 1 } : post) })); notify("评论已留下"); }} />;
  else if (page === "stray") content = <StrayPage copy={copy} data={data} go={go} />;
  else if (page === "stray-new") content = <StrayNewPage user={data.user} onBack={() => go("stray")} onSave={(report) => { patch((prev) => ({ ...prev, strayReports: [report, ...prev.strayReports], user: bumpUsage(prev.user) })); go("stray"); notify("喵～流浪猫记录已保存"); }} />;
  else if (page === "profile") content = <ProfilePage copy={copy} data={data} go={go} />;
  else content = <SettingsPage copy={copy} data={data} onLanguageChange={(language) => { saveLanguage(language); patch((prev) => ({ ...prev, language })); notify(language === "en" ? "Language updated" : "语言已切换"); }} onReset={() => { if (confirm("确定清空本机保存的数据吗？")) { const blank = emptyData(); setData({ ...blank, language: data.language }); setPage("login"); notify("已清空本地数据"); } }} onBack={() => go("profile")} />;

  return (
    <Shell page={page} onNavigate={go} toast={toast} copy={copy}>
      {loading && <PawLoader />}
      {content}
    </Shell>
  );
}

function bumpUsage(user: User | null): User | null {
  return user ? { ...user, realUsageScore: user.realUsageScore + 12, lastActiveAt: nowIso(), canUseStrayCatMap: canUseStray({ ...user, realUsageScore: user.realUsageScore + 12 }) } : user;
}

function canUseStray(user: User) {
  const days = (Date.now() - new Date(user.createdAt).getTime()) / 86400000;
  return days >= 30 && user.realUsageScore >= 30;
}

function LoginPage({ copy, onLogin, onDemo }: { copy: Copy; onLogin: (user: User) => void; onDemo: (data: AppData) => void }) {
  const [nickname, setNickname] = useState("");
  const [contact, setContact] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!nickname.trim() || !contact.trim()) {
      alert(copy.login.missing);
      return;
    }
    onLogin({
      id: makeId("user"),
      nickname,
      emailOrPhone: contact,
      avatar: `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(nickname)}`,
      createdAt: nowIso(),
      lastActiveAt: nowIso(),
      realUsageScore: 0,
      canUseStrayCatMap: false,
    });
  }

  function demo() {
    const user: User = {
      id: "demo_user",
      nickname: "小栗铲屎官",
      emailOrPhone: "demo@catdiary.local",
      avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=demo-cat",
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      lastActiveAt: nowIso(),
      realUsageScore: 86,
      canUseStrayCatMap: true,
    };
    const cat: CatProfile = {
      id: "demo_cat",
      userId: user.id,
      name: "栗子",
      gender: "妹妹",
      birthday: "2023-05-20",
      age: "3 岁",
      breed: "英短",
      color: "蓝白",
      weight: "4.2kg",
      sterilized: true,
      vaccineStatus: "已完成年度疫苗",
      personalityTags: ["粘人", "爱玩", "高冷"],
      habitTags: ["晚饭 19:00", "喜欢毛线球", "午后晒太阳"],
      habitsText: "喜欢晚上巡逻，睡前会来踩奶。",
      ownerNickname: user.nickname,
      cartoonAvatar: "",
      createdAt: nowIso(),
    };
    cat.cartoonAvatar = generateCatAvatar(cat);
    onDemo({
      ...emptyData(),
      language: "zh-CN",
      user,
      cat,
      album: [
        {
          id: "demo_album_1",
          userId: user.id,
          catId: cat.id,
          mediaType: "image",
          fileUrl: cat.cartoonAvatar,
          tags: ["玩耍", "开心"],
          note: "今天主动叼毛线球来找我。",
          detectedMood: "开心",
          createdAt: nowIso(),
        },
      ],
      healthRecords: [],
    });
  }

  return (
    <div className="login-page">
      <section className="hero-panel">
        <div className="hero-cat">=^._.^=</div>
        <h1>{APP_NAME}</h1>
        <p>{copy.login.subtitle}</p>
      </section>
      <form className="form-card" onSubmit={submit}>
        <label>{copy.login.nickname}<input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="例如 小栗铲屎官" /></label>
        <label>{copy.login.contact}<input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="仅本机原型保存" /></label>
        <button className="primary-button">{copy.login.submit}</button>
        <button type="button" className="ghost-button full" onClick={demo}>{copy.login.demo}</button>
      </form>
    </div>
  );
}

function CatCreatePage({ copy, user, onSave }: { copy: Copy; user: User; onSave: (cat: CatProfile) => void }) {
  const [form, setForm] = useState({
    name: "",
    gender: "" as Gender | "",
    birthday: "",
    age: "",
    breed: "",
    color: "",
    weight: "",
    sterilized: false,
    vaccineStatus: "",
    personalityTags: [] as string[],
    habitsText: "",
    ownerNickname: user.nickname,
    note: "",
  });

  function save(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.gender || !form.breed.trim()) {
      alert("请先填写猫咪姓名、性别和品种，其他信息可以之后慢慢补。");
      return;
    }
    const cat: CatProfile = {
      id: makeId("cat"),
      userId: user.id,
      ...form,
      gender: form.gender as Gender,
      habitTags: form.habitsText.split(/[，,。\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 6),
      ownerNickname: form.ownerNickname || user.nickname,
      cartoonAvatar: "",
      createdAt: nowIso(),
    };
    cat.cartoonAvatar = generateCatAvatar(cat);
    onSave(cat);
  }

  return (
    <form className="stack-page" onSubmit={save}>
      <PageHeader title={copy.catCreate.title} subtitle={copy.catCreate.subtitle} />
      <div className="form-card">
        <label>猫咪名字<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="咪咪" /></label>
        <div className="field-grid">
          <label>性别<select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender | "" })}><option value="">请选择</option><option>妹妹</option><option>弟弟</option><option>未知</option></select></label>
          <label>生日 <span className="optional-mark">选填</span><input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} /></label>
        </div>
        <div className="field-grid">
          <label>年龄 <span className="optional-mark">选填</span><input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="2 岁" /></label>
          <label>体重 <span className="optional-mark">选填</span><input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="4.5kg" /></label>
        </div>
        <label>品种<input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="英短 / 田园猫 / 布偶" /></label>
        <label>毛色 <span className="optional-mark">选填</span><input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="橘白 / 三花 / 蓝白" /></label>
        <label>疫苗情况 <span className="optional-mark">选填</span><input value={form.vaccineStatus} onChange={(e) => setForm({ ...form, vaccineStatus: e.target.value })} placeholder="已完成 / 待补打 / 不确定" /></label>
        <label>主人昵称 <span className="optional-mark">选填</span><input value={form.ownerNickname} onChange={(e) => setForm({ ...form, ownerNickname: e.target.value })} placeholder="铲屎官昵称" /></label>
        <label className="check-line"><input type="checkbox" checked={form.sterilized} onChange={(e) => setForm({ ...form, sterilized: e.target.checked })} /> 是否绝育 <span className="optional-mark">选填</span></label>
        <section>
          <h3>性格标签 <span className="optional-mark">选填</span></h3>
          <SegmentedTags options={personalityOptions} value={form.personalityTags} onChange={(personalityTags) => setForm({ ...form, personalityTags })} />
        </section>
        <label>日常习惯 <span className="optional-mark">选填</span><textarea value={form.habitsText} onChange={(e) => setForm({ ...form, habitsText: e.target.value })} placeholder="吃饭时间、睡觉时间、喜欢的玩具、常见行为..." /></label>
        <label>备注 <span className="optional-mark">选填</span><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="其他想记录的小信息..." /></label>
        <button className="primary-button">{copy.catCreate.submit}</button>
      </div>
    </form>
  );
}

function HomePage({ data, go }: { data: AppData; go: (page: Page) => void }) {
  const cat = data.cat!;
  const copy = text[data.language || "zh-CN"];
  const latestAnalysis = data.analyses[0];
  const latestHealth = data.healthRecords[0];
  const today = new Date().toDateString();
  const hasTodayMoment = data.analyses.some((item) => new Date(item.createdAt).toDateString() === today) || data.album.some((item) => new Date(item.createdAt).toDateString() === today);
  const mood = latestAnalysis?.resultMood || (data.album.some((item) => item.tags.includes("玩耍")) ? "开心" : "有点无聊");
  const homeActions = [
    !hasTodayMoment ? { label: copy.home.uploadMoment, page: "insight" as Page } : null,
    latestHealth ? { label: copy.home.viewHealthNote, page: "notes" as Page } : { label: copy.home.addQuickNote, page: "notes-new" as Page },
    data.album.length >= 7 ? { label: copy.home.seeMoodTrend, page: "album" as Page } : null,
    data.user?.canUseStrayCatMap ? { label: copy.home.openStrayMap, page: "stray" as Page } : null,
  ].filter(Boolean).slice(0, 3) as { label: string; page: Page }[];
  return (
    <div className="stack-page">
      <PageHeader
        title={`${copy.home.greeting}，${data.user!.nickname}`}
        subtitle={`${copy.home.todayWith} ${cat.name}`}
        action={<button className="profile-button" aria-label={copy.home.profile} onClick={() => go("profile")}><img src={data.user!.avatar} alt="" /></button>}
      />
      <CatCard cat={cat} status={mood.includes("紧张") ? copy.home.needsSpace : copy.home.calm} />
      <MoodCard mood={copy.home.statusTitle} text={`${cat.name}${mood.includes("紧张") ? copy.home.needsSpace : copy.home.calm}`} />
      <section className="soft-card">
        <span className="eyebrow">{copy.home.remindersTitle}</span>
        <div className="reminder-grid">
          {copy.home.reminders.map((item) => <button key={item}>{item}</button>)}
        </div>
      </section>
      <section className="soft-card">
        <span className="eyebrow">{copy.home.actionsTitle}</span>
        <div className="home-actions">
          {homeActions.length ? homeActions.map((action) => <button className="home-action" key={action.label} onClick={() => go(action.page)}>{action.label}</button>) : <p>{copy.home.noActions}</p>}
        </div>
      </section>
      <Disclaimer />
    </div>
  );
}

function InsightPage({ copy, data, loading, setLoading, onSave }: { copy: Copy; data: AppData; loading: boolean; setLoading: (v: boolean) => void; onSave: (a: MediaAnalysis) => void }) {
  const [preview, setPreview] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sceneTags, setSceneTags] = useState<string[]>([]);
  const [behaviorTags, setBehaviorTags] = useState<string[]>([]);
  const [soundTags, setSoundTags] = useState<string[]>([]);
  const [interactionTags, setInteractionTags] = useState<string[]>([]);
  const [last, setLast] = useState<CatBehaviorAnalysisResult | null>(null);
  const [error, setError] = useState("");
  const latestSaved = data.analyses[0] || null;

  async function choose(nextFile: File) {
    setError("");
    setFile(nextFile);
    setPreview(await fileToDataUrl(nextFile));
  }

  async function analyze() {
    const selectedCount = sceneTags.length + behaviorTags.length + soundTags.length + interactionTags.length;
    if (selectedCount === 0) {
      setError("请至少选择一个场景、行为、声音或互动标签，这样 Mewly 才能推理宝宝想表达什么。");
      return;
    }
    try {
      setError("");
      setLoading(true);
      const type: MediaType = file
        ? file.type.startsWith("video")
          ? "video"
          : file.type.startsWith("audio")
            ? "audio"
            : "image"
        : "manual";
      if (file) await analyzeCatMediaWithAI(file);
      const behaviorResult = analyzeCatBehavior({
        mediaType: type,
        sceneTags,
        behaviorTags,
        soundTags,
        interactionTags,
        catProfile: {
          name: data.cat?.name,
          age: data.cat?.age,
          breed: data.cat?.breed,
          gender: data.cat?.gender,
          personalityTags: data.cat?.personalityTags,
        },
      });
      const allSelectedTags = [...sceneTags, ...behaviorTags, ...soundTags, ...interactionTags];
      const analysis: MediaAnalysis = {
        id: makeId("analysis"),
        userId: data.user!.id,
        catId: data.cat!.id,
        mediaType: type,
        fileUrl: preview,
        selectedBehaviorTags: allSelectedTags,
        resultMood: behaviorResult.primaryMood,
        resultIntent: behaviorResult.possibleIntent,
        confidence: behaviorResult.confidence,
        reasons: behaviorResult.reasons,
        suggestions: [...behaviorResult.suggestions, ...behaviorResult.observationTips],
        riskNotice: behaviorResult.riskNotice,
        createdAt: nowIso(),
      };
      setLast(behaviorResult);
      onSave(analysis);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "分析时遇到一点小问题，请稍后再试。";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const renderUploadButton = (label: string, accept: string) => (
    <label className="upload-choice">
      {label}
      <input
        type="file"
        accept={accept}
        onChange={(event) => {
          const nextFile = event.target.files?.[0];
          if (nextFile) choose(nextFile);
        }}
      />
    </label>
  );

  return (
    <div className="stack-page insight-page">
      <PageHeader title={copy.insight.title} subtitle={copy.insight.subtitle} />
      <section className="soft-card">
        <span className="eyebrow">上传区域</span>
        <p>上传猫咪照片、视频或音频，Mewly 会帮你分析宝宝现在可能想表达什么。</p>
        <div className="upload-choice-grid">
          {renderUploadButton("上传图片", "image/*")}
          {renderUploadButton("上传视频", "video/*")}
          {renderUploadButton("上传音频", "audio/*")}
        </div>
      </section>
      <UploadPreview accept="image/*,video/*,audio/*" preview={preview} onFile={choose} />
      {preview ? (
        <p className="notice">已上传成功。为了让分析更准确，请选择你观察到的猫咪行为特征。当前不会假装自动识别媒体内容。</p>
      ) : (
        <EmptyState
          title="可以先不上传，直接选择行为特征"
          text="上传媒体会方便回看；如果现在只想分析，也可以直接选择场景、耳朵、尾巴、声音等标签，Mewly 会根据本地猫咪行为知识库推理。"
          action={<div className="empty-actions">{renderUploadButton("上传图片", "image/*")}{renderUploadButton("上传视频", "video/*")}{renderUploadButton("上传音频", "audio/*")}</div>}
        />
      )}
      <section className="form-card">
        <p className="notice">{copy.insight.uploadingHint}</p>
        <div className="action-strip">
          <span>{copy.insight.upload}</span>
          <span>选择场景</span>
          <span>选择行为标签</span>
          <span>{copy.insight.start}</span>
        </div>
        <section className="tag-section">
          <h3>当前场景</h3>
          <SegmentedTags options={sceneOptions} value={sceneTags} onChange={setSceneTags} />
        </section>
        {behaviorTagGroups.map((group) => {
          const value = group.title === "声音" ? soundTags : group.title === "互动反应" ? interactionTags : behaviorTags;
          const onChange = group.title === "声音" ? setSoundTags : group.title === "互动反应" ? setInteractionTags : setBehaviorTags;
          const options = group.title === "声音" ? soundBehaviorTags : group.title === "互动反应" ? interactionBehaviorTags : group.tags;
          return (
            <section className="tag-section" key={group.title}>
              <h3>{group.title}</h3>
              <SegmentedTags options={options} value={value} onChange={onChange} />
            </section>
          );
        })}
        {error && <p className="inline-error">{error}</p>}
        <button className="primary-button" disabled={loading} onClick={analyze}>{loading ? "分析中..." : copy.insight.start}</button>
      </section>
      {last && (
        <section className="result-card">
          <span className="eyebrow">{copy.insight.result}</span>
          <h2>{last.primaryMood}</h2>
          <p>{last.possibleIntent} · 置信度 {last.confidence}%</p>
          <p className="result-text">{last.resultText}</p>
          <h4>命中的行为知识</h4>
          <ul>{last.matchedRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
          <h4>{copy.insight.reasons}</h4>
          <ul>{last.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          <h4>铲屎官可以怎么做</h4>
          <ul>{last.suggestions.map((s) => <li key={s}>{s}</li>)}</ul>
          <h4>需要继续观察</h4>
          <ul>{last.observationTips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
          <p className="disclaimer">{last.riskNotice}</p>
        </section>
      )}
      {!last && latestSaved && (
        <section className="soft-card">
          <span className="eyebrow">最近一次分析</span>
          <h3>{latestSaved.resultMood}</h3>
          <p>{latestSaved.resultIntent} · 置信度 {latestSaved.confidence}%</p>
        </section>
      )}
    </div>
  );
}

function AlbumPage({ copy, data, onOpen, onSave }: { copy: Copy; data: AppData; onOpen: (id: string) => void; onSave: (item: AlbumItem) => void }) {
  const [preview, setPreview] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");

  async function choose(nextFile: File) {
    if (!nextFile.type.startsWith("image") && !nextFile.type.startsWith("video")) {
      alert("相册目前支持图片和视频。");
      return;
    }
    setFile(nextFile);
    setPreview(await fileToDataUrl(nextFile));
  }

  function save() {
    if (!file || !preview) {
      alert("先选择一张照片或一段视频吧。");
      return;
    }
    onSave({
      id: makeId("album"),
      userId: data.user!.id,
      catId: data.cat!.id,
      mediaType: file.type.startsWith("video") ? "video" : "image",
      fileUrl: preview,
      tags,
      note,
      detectedMood: tags.includes("玩耍") || tags.includes("开心") ? "开心" : tags.includes("生病") ? "需观察" : "日常",
      createdAt: nowIso(),
    });
    setPreview("");
    setFile(null);
    setTags([]);
    setNote("");
  }

  return (
    <div className="stack-page">
      <PageHeader title={copy.album.title} subtitle={copy.album.subtitle} />
      <TrendCard album={data.album} />
      <section className="form-card">
        <UploadPreview accept="image/*,video/*" preview={preview} onFile={choose} />
        <div className="action-strip">
          <span>{copy.album.addPhoto}</span>
          <span>{copy.album.timeline}</span>
          <span>{copy.album.moodTrend}</span>
        </div>
        <SegmentedTags options={albumTags} value={tags} onChange={setTags} />
        <label>{copy.album.note}<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="今天发生了什么可爱小事？" /></label>
        <button className="primary-button" onClick={save}>{copy.album.save}</button>
      </section>
      {data.album.length ? (
        <div className="album-grid">{data.album.map((item) => <AlbumTile item={item} onOpen={() => onOpen(item.id)} key={item.id} />)}</div>
      ) : (
        <EmptyState title={copy.album.emptyTitle} text={copy.album.emptyText} />
      )}
    </div>
  );
}

function AlbumDetailPage({ item, onBack, onDelete }: { item?: AlbumItem; onBack: () => void; onDelete: (id: string) => void }) {
  if (!item) return <EmptyState title="没有找到这条记录" text="可能已经被删除了。" action={<button className="primary-button" onClick={onBack}>返回相册</button>} />;
  return (
    <div className="stack-page">
      <PageHeader title="相册详情" subtitle={new Date(item.createdAt).toLocaleString()} back={onBack} action={<button className="icon-button danger" onClick={() => onDelete(item.id)}>×</button>} />
      <section className="detail-media">{item.mediaType === "video" ? <video src={item.fileUrl} controls /> : <img src={item.fileUrl} alt="相册详情" />}</section>
      <section className="soft-card">
        <h3>{item.detectedMood}</h3>
        <div className="tag-row">{item.tags.map((tag) => <span className="mini-tag" key={tag}>{tag}</span>)}</div>
        <p>{item.note || "主人还没有写备注。"}</p>
      </section>
    </div>
  );
}

function NotesPage({ copy, records, go, onOpen }: { copy: Copy; records: HealthRecord[]; go: (p: Page) => void; onOpen: (id: string) => void }) {
  return (
    <div className="stack-page">
      <PageHeader title={copy.notes.title} subtitle={copy.notes.subtitle} action={<button className="primary-small" onClick={() => go("notes-new")}>{copy.common.add}</button>} />
      <section className="soft-card">
        <span className="eyebrow">{copy.notes.trend}</span>
        <div className="action-strip">
          <span>{copy.notes.add}</span>
          <span>{copy.notes.exportVet}</span>
          <span>{copy.notes.reminder}</span>
        </div>
        <p>{records.length ? `最近共记录 ${records.length} 条异常，最新风险等级：${records[0].riskLevel}` : "暂未发现连续异常趋势。"}</p>
      </section>
      {records.length ? records.map((record) => (
        <button className="record-row" key={record.id} onClick={() => onOpen(record.id)}>
          <strong>{record.riskLevel}</strong>
          <span>{record.abnormalTypes.join("、")}</span>
          <small>{new Date(record.createdAt).toLocaleString()}</small>
        </button>
      )) : <EmptyState title={copy.notes.emptyTitle} text={copy.notes.emptyText} action={<button className="primary-button" onClick={() => go("notes-new")}>{copy.notes.add}</button>} />}
      <Disclaimer />
    </div>
  );
}

function NotesNewPage({ copy, userId, catId, onBack, onSave }: { copy: Copy; userId: string; catId: string; onBack: () => void; onSave: (record: HealthRecord) => void }) {
  const [types, setTypes] = useState<string[]>([]);
  const [severity, setSeverity] = useState<Severity>("轻微");
  const [duration, setDuration] = useState("");
  const [appetiteChanged, setAppetiteChanged] = useState(false);
  const [energyChanged, setEnergyChanged] = useState(false);
  const [toiletChanged, setToiletChanged] = useState(false);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState("");

  async function choose(file: File) {
    setPreview(await fileToDataUrl(file));
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (!types.length || !duration.trim()) {
      alert("请选择异常类型，并写一下持续时间。");
      return;
    }
    const risk = analyzeHealthRisk({ abnormalTypes: types, severity, duration, appetiteChanged, energyChanged, toiletChanged, note });
    onSave({
      id: makeId("health"),
      userId,
      catId,
      abnormalTypes: types,
      severity,
      duration,
      appetiteChanged,
      energyChanged,
      toiletChanged,
      note,
      mediaUrls: preview ? [preview] : [],
      ...risk,
      createdAt: nowIso(),
    });
  }

  return (
    <form className="stack-page" onSubmit={save}>
      <PageHeader title={copy.notes.newTitle} subtitle={copy.notes.newSubtitle} back={onBack} />
      <section className="form-card">
        <h3>异常类型</h3>
        <SegmentedTags options={abnormalOptions} value={types} onChange={setTypes} />
        <label>严重程度<select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}><option>轻微</option><option>中等</option><option>严重</option></select></label>
        <label>持续时间<input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="例如 3 小时 / 超过 24 小时" /></label>
        <label className="check-line"><input type="checkbox" checked={appetiteChanged} onChange={(e) => setAppetiteChanged(e.target.checked)} /> 伴随食欲下降</label>
        <label className="check-line"><input type="checkbox" checked={energyChanged} onChange={(e) => setEnergyChanged(e.target.checked)} /> 伴随精神变差</label>
        <label className="check-line"><input type="checkbox" checked={toiletChanged} onChange={(e) => setToiletChanged(e.target.checked)} /> 伴随排便 / 排尿异常</label>
        <UploadPreview accept="image/*,video/*" preview={preview} onFile={choose} />
        <label>主人备注<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="次数、颜色、场景、是否和平时不同..." /></label>
        <button className="primary-button">生成风险提示</button>
      </section>
    </form>
  );
}

function NotesResultPage({ copy, record, onBack }: { copy: Copy; record?: HealthRecord; onBack: () => void }) {
  if (!record) return <EmptyState title="还没有分析结果" text="新增一条健康记录后，这里会展示风险分析卡片。" action={<button className="primary-button" onClick={onBack}>返回</button>} />;
  return (
    <div className="stack-page">
      <PageHeader title={copy.notes.resultTitle} subtitle={new Date(record.createdAt).toLocaleString()} back={onBack} />
      <HealthRiskCard record={record} />
      {!!record.mediaUrls.length && <section className="detail-media"><img src={record.mediaUrls[0]} alt="健康记录附件" /></section>}
      <section className="soft-card">
        <h3>后续观察项目</h3>
        <p>食欲、饮水、精神、排便排尿频率、是否继续躲藏或疼痛叫声。</p>
      </section>
    </div>
  );
}

function ForumPage({ copy, data, go, posts, onNew, onOpen, updatePost }: { copy: Copy; data: AppData; go: (p: Page) => void; posts: ForumPost[]; onNew: () => void; onOpen: (id: string) => void; updatePost: (id: string, fn: (p: ForumPost) => ForumPost) => void }) {
  const [sort, setSort] = useState<"最新" | "热门">("最新");
  const ordered = useMemo(() => [...posts].sort((a, b) => sort === "热门" ? b.likeCount - a.likeCount : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [posts, sort]);
  return (
    <div className="stack-page">
      <PageHeader title={copy.community.title} subtitle={copy.community.subtitle} action={<button className="primary-small" onClick={onNew}>{copy.community.createPost}</button>} />
      {data.user?.canUseStrayCatMap ? (
        <section className="soft-card stray-entry">
          <span className="eyebrow">{copy.community.strayTitle}</span>
          <p>{copy.community.straySubtitle}</p>
          <button className="ghost-button" onClick={() => go("stray")}>{copy.community.viewStrays}</button>
        </section>
      ) : (
        <p className="notice">{copy.community.lockedStray}</p>
      )}
      <div className="action-strip">
        <span>{copy.community.createPost}</span>
        <span>添加照片 / 视频</span>
        <span>选择话题</span>
      </div>
      <div className="segmented"><button className={sort === "最新" ? "active" : ""} onClick={() => setSort("最新")}>{copy.community.latest}</button><button className={sort === "热门" ? "active" : ""} onClick={() => setSort("热门")}>{copy.community.hot}</button></div>
      {ordered.map((post) => (
        <ForumPostCard
          key={post.id}
          post={post}
          onOpen={() => onOpen(post.id)}
          onLike={() => updatePost(post.id, (p) => ({ ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 }))}
          onToggleCollect={() => updatePost(post.id, (p) => ({ ...p, collected: !p.collected }))}
          onToggleFollow={() => updatePost(post.id, (p) => ({ ...p, followed: !p.followed }))}
        />
      ))}
    </div>
  );
}

function PostNewPage({ user, onBack, onSave }: { user: User; onBack: () => void; onSave: (post: ForumPost) => void }) {
  const [content, setContent] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [media, setMedia] = useState<string[]>([]);
  async function choose(file: File) {
    setMedia([await fileToDataUrl(file)]);
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) {
      alert("动态文字还空着呢，写一点再发布吧。");
      return;
    }
    onSave({
      id: makeId("post"),
      userId: user.id,
      authorName: user.nickname,
      authorAvatar: user.avatar,
      content,
      mediaUrls: media,
      topics,
      likeCount: 0,
      commentCount: 0,
      liked: false,
      collected: false,
      followed: false,
      createdAt: nowIso(),
    });
  }
  return (
    <form className="stack-page" onSubmit={save}>
      <PageHeader title="发布动态" subtitle="把今天的小猫故事讲给喵圈。" back={onBack} />
      <section className="form-card">
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="今天的小猫发生了什么？" />
        <UploadPreview accept="image/*,video/*" preview={media[0]} onFile={choose} />
        <SegmentedTags options={forumTopics} value={topics} onChange={setTopics} />
        <button className="primary-button">发布</button>
      </section>
    </form>
  );
}

function PostDetailPage({ post, comments, user, onBack, onComment }: { post?: ForumPost; comments: { id: string; content: string; createdAt: string }[]; user: User; onBack: () => void; onComment: (c: { id: string; postId: string; userId: string; content: string; createdAt: string }) => void }) {
  const [content, setContent] = useState("");
  if (!post) return <EmptyState title="动态不见了" text="可能已经删除。" action={<button className="primary-button" onClick={onBack}>返回喵圈</button>} />;
  const activePost = post;
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    onComment({ id: makeId("comment"), postId: activePost.id, userId: user.id, content, createdAt: nowIso() });
    setContent("");
  }
  return (
    <div className="stack-page">
      <PageHeader title="动态详情" subtitle={activePost.authorName} back={onBack} />
      <section className="post-card">
        <p>{activePost.content}</p>
        {!!activePost.mediaUrls.length && <div className="media-grid">{activePost.mediaUrls.map((url) => <img src={url} alt="动态图片" key={url} />)}</div>}
        <div className="topic-row">{activePost.topics.map((topic) => <span key={topic}>#{topic}</span>)}</div>
      </section>
      <form className="comment-box" onSubmit={submit}>
        <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="温柔评论一句..." />
        <button>发送</button>
      </form>
      <section className="comment-list">
        {comments.length ? comments.map((c) => <p key={c.id}>{c.content}<small>{new Date(c.createdAt).toLocaleString()}</small></p>) : <EmptyState title="还没有评论" text="做第一个温柔回应的人。" />}
      </section>
    </div>
  );
}

function StrayPage({ copy, data, go }: { copy: Copy; data: AppData; go: (p: Page) => void }) {
  const user = data.user!;
  if (!user.canUseStrayCatMap) {
    return (
      <div className="stack-page">
        <PageHeader title={copy.stray.title} subtitle="安全优先，满足条件后开启。" />
        <section className="lock-card">
          <h2>{copy.stray.lockedTitle}</h2>
          <p>{copy.stray.lockedText}</p>
          <div className="progress-line"><span style={{ width: `${Math.min(100, user.realUsageScore)}%` }} /></div>
          <p className="notice">当前使用分：{user.realUsageScore} / 30。正式版会加入审核，避免有人利用地图伤害流浪猫。</p>
        </section>
      </div>
    );
  }
  return (
    <div className="stack-page">
      <PageHeader title={copy.stray.title} subtitle={copy.stray.subtitle} action={<button className="primary-small" onClick={() => go("stray-new")}>{copy.stray.report}</button>} />
      <div className="action-strip">
        <span>{copy.stray.report}</span>
        <span>添加大概位置</span>
        <span>更新状态</span>
      </div>
      <section className="soft-card">
        <h3>{copy.stray.safety}</h3>
        <p>{copy.stray.safetyText}</p>
      </section>
      {data.strayReports.map((report) => <StrayCatMapCard report={report} key={report.id} />)}
    </div>
  );
}

function StrayNewPage({ user, onBack, onSave }: { user: User; onBack: () => void; onSave: (r: StrayCatReport) => void }) {
  const [approximateLocation, setApproximateLocation] = useState("");
  const [hiddenExactLocation, setHiddenExactLocation] = useState("");
  const [status, setStatus] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [currentStatus, setCurrentStatus] = useState("待观察");
  const [image, setImage] = useState("");
  async function choose(file: File) {
    setImage(await fileToDataUrl(file));
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!approximateLocation.trim() || !description.trim()) {
      alert("请填写大概区域和情况描述，不要填写门牌号或电话。");
      return;
    }
    onSave({
      id: makeId("stray"),
      userId: user.id,
      approximateLocation,
      hiddenExactLocation,
      images: image ? [image] : [],
      videos: [],
      catStatusTags: status,
      needHelpTypes: needs,
      description,
      currentStatus,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }
  return (
    <form className="stack-page" onSubmit={save}>
      <PageHeader title="发布流浪猫记录" subtitle="请只填写模糊位置，保护小猫和自己。" back={onBack} />
      <section className="form-card">
        <label>大概区域<input value={approximateLocation} onChange={(e) => setApproximateLocation(e.target.value)} placeholder="例如 某小区东门一带" /></label>
        <label>精确位置，仅自己可见<input value={hiddenExactLocation} onChange={(e) => setHiddenExactLocation(e.target.value)} placeholder="不要公开门牌号" /></label>
        <UploadPreview accept="image/*,video/*" preview={image} onFile={choose} />
        <h3>猫咪状态</h3><SegmentedTags options={strayStatusTags} value={status} onChange={setStatus} />
        <h3>需要帮助</h3><SegmentedTags options={helpTypes} value={needs} onChange={setNeeds} />
        <label>当前状态<select value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value)}><option>待观察</option><option>已喂养</option><option>已救助</option><option>已领养</option><option>已绝育</option><option>未找到</option></select></label>
        <label>描述<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="请描述外观、状态、出现时间。不要公开电话或家庭住址。" /></label>
        <p className="notice">请温柔对待小猫，不要惊吓、捕捉或伤害。领养信息需进一步审核。</p>
        <button className="primary-button">保存记录</button>
      </section>
    </form>
  );
}

function getStrayUnlockInfo(user: User) {
  const days = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);
  return {
    days,
    daysLeft: Math.max(0, 30 - days),
    usageLeft: Math.max(0, 30 - user.realUsageScore),
    unlocked: user.canUseStrayCatMap,
  };
}

function ProfilePage({ copy, data, go }: { copy: Copy; data: AppData; go: (p: Page) => void }) {
  const unlock = getStrayUnlockInfo(data.user!);
  const unlockText = unlock.unlocked
    ? copy.profile.unlocked
    : unlock.daysLeft > 0
      ? interpolate(copy.profile.daysLeft, { days: unlock.daysLeft })
      : copy.profile.usageLeft;
  return (
    <div className="stack-page">
      <PageHeader title={copy.profile.title} subtitle={data.user!.nickname} action={<button className="icon-button" onClick={() => go("settings")}>⚙</button>} />
      {data.cat && <CatCard cat={data.cat} compact />}
      <section className="stats-grid">
        <div><strong>{data.album.length}</strong><small>{copy.nav.album}</small></div>
        <div><strong>{data.analyses.length}</strong><small>{copy.nav.insight}</small></div>
        <div><strong>{data.healthRecords.length}</strong><small>{copy.nav.notes}</small></div>
      </section>
      <section className="soft-card">
        <span className="eyebrow">{copy.profile.strayUnlock}</span>
        <h3>{unlockText}</h3>
        <div className="progress-line"><span style={{ width: `${unlock.unlocked ? 100 : Math.min(100, Math.max(unlock.days / 30, data.user!.realUsageScore / 30) * 100)}%` }} /></div>
        <p className="notice">已使用 {unlock.days} 天 · 使用记录 {data.user!.realUsageScore} / 30</p>
      </section>
      <section className="menu-list">
        <button onClick={() => go("cat-create")}>{copy.profile.catManage}</button>
        <button onClick={() => go("stray")}>{copy.stray.title}</button>
        <button onClick={() => alert(JSON.stringify(data, null, 2))}>{copy.profile.exportData}</button>
        <button onClick={() => alert("Beta 版隐私政策：数据默认保存在本机，不公开精确位置和敏感联系方式。")}>{copy.profile.privacy}</button>
        <button onClick={() => alert("Beta 版用户协议：请温柔对待小猫，不发布虐待、诈骗、广告等内容。")}>{copy.profile.terms}</button>
        <button onClick={() => go("settings")}>{copy.settings.title}</button>
      </section>
      <section className="soft-card">
        <h3>{copy.profile.appVersion}</h3>
        <p>{APP_VERSION}</p>
        <h3>{copy.profile.betaInfo}</h3>
        <p>当前版本用于朋友内测，可通过手机浏览器、PWA 主屏幕和 Capacitor 打包体验核心流程。</p>
      </section>
    </div>
  );
}

function SettingsPage({ copy, data, onBack, onReset, onLanguageChange }: { copy: Copy; data: AppData; onBack: () => void; onReset: () => void; onLanguageChange: (language: Language) => void }) {
  return (
    <div className="stack-page">
      <PageHeader title={copy.settings.title} subtitle={APP_NAME} back={onBack} />
      <section className="soft-card">
        <h3>{copy.settings.language}</h3>
        <div className="segmented">
          <button className={data.language === "zh-CN" ? "active" : ""} onClick={() => onLanguageChange("zh-CN")}>{copy.settings.chinese}</button>
          <button className={data.language === "en" ? "active" : ""} onClick={() => onLanguageChange("en")}>{copy.settings.english}</button>
        </div>
      </section>
      <section className="soft-card">
        <h3>{copy.settings.localStorage}</h3>
        <p>{copy.settings.localStorageText}</p>
      </section>
      <section className="soft-card">
        <h3>{copy.settings.apiSlots}</h3>
        <p>{copy.settings.apiSlotsText}</p>
      </section>
      <section className="soft-card">
        <p>当前用户：{data.user?.nickname || "未登录"}</p>
        <button className="danger-button" onClick={onReset}>{copy.settings.clear}</button>
      </section>
    </div>
  );
}
