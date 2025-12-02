// app.js

// ----------------------------------------------------
// JAVASCRIPT: グラフ描画ロジック (完全版・修正済)
// ----------------------------------------------------

// --- 基準日（当日） ---
const TODAY = new Date();

// --- DOM要素取得 ---
const chartPlotArea = document.getElementById('chart-plot-area');
const yAxisLabelsContainer = document.getElementById('y-axis-labels');
const xAxisTimeline = document.getElementById('x-axis-timeline'); 
const chartScrollArea = document.querySelector('.chart-scroll-area'); 

// フィルター用DOM要素
const mainFilterBtns = document.querySelectorAll('.main-filter-btn');
const partySelectContainer = document.getElementById('party-filter-container');
const partySelect = document.getElementById('party-select');

// ズーム機能のために可変(let)
let SCALING_FACTOR = 0.5; 
const ROW_HEIGHT = 27; 

const SIDEBAR_SCALE_PX_PER_DAY = 0.3; 
const MIN_BLOCK_HEIGHT = 60;

// ズームレベル設定
const ZOOM_LEVELS = [0.1, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
let currentZoomIndex = 2; 

// --- 定数定義 ---
const CAT_CABINET = 'cabinet';
const CAT_PARTY = 'party';
const CAT_DIET = 'diet';
const CAT_LOCAL = 'local';

// --- 状態管理変数 ---
// 初期状態ですべてのカテゴリを有効化 (Setを使用)
const activeCategoryFilters = new Set([CAT_CABINET, CAT_DIET, CAT_PARTY, CAT_LOCAL]);
let activePartyFilter = 'all'; // 'all' or specific party name (CabinetName)
// ランキングサイドバー用スコープ
const activeScopes = new Set([CAT_CABINET, CAT_DIET, CAT_PARTY, CAT_LOCAL]);

const CAT_TITLES = {
    [CAT_CABINET]: "内閣役職",
    [CAT_DIET]: "国会役職",
    [CAT_PARTY]: "自由民主党役員", // 便宜上固定だがデータによって変わる可能性あり
    [CAT_LOCAL]: "地方自治体"
};

const SPACER_ID_PREFIX = 'SPACER_';
const SPACER_ROW_GAP_ID = 'SPACER_ROW_GAP';     
const SPACER_ROW_TITLE_ID = 'SPACER_ROW_TITLE'; 
const SPACER_DEPUTY_GAP = 'SPACER_DEPUTY_GAP'; // 副長官用スペーサー

// メインチャート用：行まとめキー
const MEXT_ROW_KEY = 'MEXT_CONSOLIDATED_ROW'; 
const AGRI_ROW_KEY = 'AGRI_CONSOLIDATED_ROW'; 
const DEFENSE_ROW_KEY = 'DEFENSE_CONSOLIDATED_ROW'; 
const KEIZAI_ZAIMU_ROW_KEY = 'KEIZAI_ZAIMU_CONSOLIDATED_ROW'; 
const KINYU_ROW_KEY = 'KINYU_CONSOLIDATED_ROW'; 
const OKINAWA_ROW_KEY = 'OKINAWA_CONSOLIDATED_ROW'; 
const KAGAKU_ROW_KEY = 'KAGAKU_CONSOLIDATED_ROW'; 
const KISEI_ROW_KEY = 'KISEI_CONSOLIDATED_ROW'; 
const BOUSAI_ROW_KEY = 'BOUSAI_CONSOLIDATED_ROW'; 
const SHOSHIKA_DANJO_ROW_KEY = 'SHOSHIKA_DANJO_CONSOLIDATED_ROW'; 
const SHOKUHIN_ROW_KEY = 'SHOKUHIN_CONSOLIDATED_ROW'; 
const UCHU_ROW_KEY = 'UCHU_CONSOLIDATED_ROW'; 
const KAIYO_ROW_KEY = 'KAIYO_CONSOLIDATED_ROW'; 
const SANGYO_SAISEI_ROW_KEY = 'SANGYO_SAISEI_CONSOLIDATED_ROW'; 
const KOJIN_JOHO_ROW_KEY = 'KOJIN_JOHO_CONSOLIDATED_ROW'; 
const MYNUMBER_ROW_KEY = 'MYNUMBER_CONSOLIDATED_ROW'; 
const COOLJAPAN_ROW_KEY = 'COOLJAPAN_CONSOLIDATED_ROW'; 
const CHITEKI_ZAISAN_ROW_KEY = 'CHITEKI_ZAISAN_CONSOLIDATED_ROW'; 
const ATARASHII_KOKYO_ROW_KEY = 'ATARASHII_KOKYO_CONSOLIDATED_ROW'; 
const CHIHOBUNKEN_ROW_KEY = 'CHIHOBUNKEN_CONSOLIDATED_ROW'; 
const CHIIKISHUKEN_ROW_KEY = 'CHIIKISHUKEN_CONSOLIDATED_ROW'; 
const GYOSEI_SASSIN_ROW_KEY = 'GYOSEI_SASSIN_CONSOLIDATED_ROW'; 
const GENSHIRYOKU_SONGAI_ROW_KEY = 'GENSHIRYOKU_SONGAI_CONSOLIDATED_ROW'; 
const GENSHIRYOKU_GYOSEI_ROW_KEY = 'GENSHIRYOKU_GYOSEI_CONSOLIDATED_ROW'; 
const GENSHIRYOKU_BOUSAI_ROW_KEY = 'GENSHIRYOKU_BOUSAI_CONSOLIDATED_ROW'; 
const AINU_ROW_KEY = 'AINU_CONSOLIDATED_ROW'; 
const AI_ROW_KEY = 'AI_CONSOLIDATED_ROW'; 
const KEIZAI_ANZEN_HOSHO_ROW_KEY = 'KEIZAI_ANZEN_HOSHO_CONSOLIDATED_ROW'; 

const OLYPARA_BASE_NAME = '国務大臣（オリンピック・パラリンピック担当）';

const LDP_SOSAI_KEY = '総裁'; 
const LDP_FUKUSOSAI_KEY = '副総裁'; 
const LDP_KANJICHO_KEY = '幹事長'; 
const LDP_SOMUKAICHO_KEY = '総務会長'; 
const LDP_SEICHOKAICHO_KEY = '政務調査会長'; 
const LDP_KOKUTAIIINCHO_KEY = '国会対策委員長'; 
const LDP_SENTAI_IINCHO_KEY = '選挙対策委員長'; 
const LDP_KANJICHO_DAIKO_KEY = '幹事長代行'; 
const LDP_SAN_GIIN_KAICHO_KEY = '参議院議員会長';

const STACK_KEY_TOKUMEI = 'STACK_KEY_TOKUMEI'; 
const STACK_KEY_KOKUMU = 'STACK_KEY_KOKUMU';   
const STACK_KEY_HANRETSU = 'STACK_KEY_HANRETSU'; 
const STACK_KEY_DEPUTY = 'STACK_KEY_DEPUTY';

const PARTY_ROLE_BASE_NAMES_SET = new Set([
    '総裁', '総裁 (代行)', '副総裁', '幹事長', '総務会長', 
    '政務調査会長', '国会対策委員長', '選挙対策委員長', '幹事長代行', '参議院議員会長'
]);

const PARTY_ROLE_ORDER = [
    LDP_SOSAI_KEY, LDP_FUKUSOSAI_KEY, LDP_KANJICHO_KEY, LDP_SOMUKAICHO_KEY,
    LDP_SEICHOKAICHO_KEY, LDP_KOKUTAIIINCHO_KEY, LDP_SENTAI_IINCHO_KEY,
    LDP_KANJICHO_DAIKO_KEY, LDP_SAN_GIIN_KAICHO_KEY
];

// 主任の大臣リスト
const SHUNIN_POSTS = [
    '内閣総理大臣', '総務大臣', '法務大臣', '外務大臣', '財務大臣', '大蔵大臣',
    '文部科学大臣', '文部大臣', '厚生労働大臣', '厚生大臣', '労働大臣',
    '農林水産大臣', '農林大臣', '農商務大臣', '経済産業大臣', '通商産業大臣', '商工大臣',
    '国土交通大臣', '運輸大臣', '建設大臣', '環境大臣', '防衛大臣', '防衛庁長官',
    '内務大臣', '陸軍大臣', '海軍大臣', '司法大臣', '逓信大臣', '鉄道大臣', '拓務大臣',
    '大東亜大臣', '農商大臣', '軍需大臣', '運輸通信大臣', '第一復員大臣', '第二復員大臣',
    '法務総裁', '郵政大臣', '電気通信大臣', '復興大臣', 'デジタル大臣',
    '内閣官房長官', '総理府総務長官', '国家公安委員会委員長', '行政管理庁長官', 
    '北海道開発庁長官', '経済企画庁長官', '科学技術庁長官', '環境庁長官', 
    '国土庁長官', '沖縄開発庁長官', '総務庁長官', '金融再生委員会委員長',
    '自治大臣', '自治庁長官'
];

// 不足していた定数を追加
const ABSORB_TARGETS = [
    "国務大臣（行政改革担当）",
    "国務大臣（公務員制度改革担当）",
    "国務大臣（感染症危機管理担当）",
    "国務大臣（国家戦略担当）"
];

let customTooltip = null;
let detailsSidebar = null;
let sidebarTitle = null;
let sidebarContent = null;
let closeDetailsSidebarBtn = null;
let rankingSidebar = null;
let rankingSidebarTitle = null;
let rankingSidebarContent = null;
let closeRankingSidebarBtn = null;
let globalOverlay = null;
let btnGlobalRanking = null; 
let btnRankModeDays = null;
let btnRankModeAppearance = null;
let btnRankModeCareer = null; 
let rankingScopeToggle = null;

let currentRankingMode = 'days'; 
let currentRankingScope = 'global'; 
let currentRoleStats = new Map(); 
let currentRolePost = null; 

let currentLeftEdgeMap = {};
let sortedPostsForYAxis = [];
let leftEdgeDate = null;
let rightEdgeDate = null;

// --- ユーティリティ関数 ---

const formatDate = (date) => {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

const formatDateFull = (date) => {
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

const formatDateJP = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${y}.${m}.${d}`;
}

const formatConcurrentPeriod = (start, end, isIncumbent = false) => {
    const s = `${start.getFullYear()}.${start.getMonth() + 1}.${start.getDate()}`;
    if (isIncumbent) {
        return `${s}〜現職`;
    }
    const e = `${end.getFullYear()}.${end.getMonth() + 1}.${end.getDate()}`;
    return `${s}〜${e}`;
};

const extractTopic = (postName) => {
    if (!postName) return null;
    const match = postName.match(/\（(.+?)\）/); 
    if (!match) return null;
    return match[1].replace(/担当大臣$/, '').replace(/担当$/, '').trim();
};

const standardizePostName = (postName) => {
    let standardName = postName.trim();
    if (standardName === "総裁 (代行)") return LDP_SOSAI_KEY;
    if (standardName === '衆議院議長') return '衆議院議長';
    if (standardName === '参議院議長') return '参議院議長';
    if (standardName === "総裁") return LDP_SOSAI_KEY;
    if (standardName === "副総裁") return LDP_FUKUSOSAI_KEY;
    if (standardName === "幹事長") return LDP_KANJICHO_KEY;
    if (standardName === "総務会長") return LDP_SOMUKAICHO_KEY;
    if (standardName === "政務調査会長") return LDP_SEICHOKAICHO_KEY;
    if (standardName === "国会対策委員長") return LDP_KOKUTAIIINCHO_KEY;
    if (standardName === "選挙対策委員長") return LDP_SENTAI_IINCHO_KEY;
    if (standardName === "幹事長代行") return LDP_KANJICHO_DAIKO_KEY;
    if (standardName === "参議院議員会長") return LDP_SAN_GIIN_KAICHO_KEY;

     if (standardName.startsWith("内閣府特命担当大臣")) {
        if (standardName.includes("経済財政")) return "経済財政政策担当大臣";
        if (standardName.includes("金融")) return "金融担当大臣";
        if (standardName.includes("沖縄")) return "沖縄及び北方対策担当大臣";
        if (standardName.includes("科学技術")) return "科学技術政策担当大臣";
        if (standardName.includes("規制改革")) return "規制改革担当大臣";
        if (standardName.includes("防災") && !standardName.includes("原子力")) return "防災担当大臣";
        if (standardName.includes("少子化") || standardName.includes("青少年") || standardName.includes("こども政策")) return "少子化・男女共同参画担当大臣";
        if (standardName.includes("男女共同")) return "男女共同参画担当大臣";
        if (standardName.includes("食品安全") || standardName.includes("消費者")) return "消費者及び食品安全担当大臣";
        if (standardName.includes("新しい公共")) return "「新しい公共」担当大臣";
        if (standardName.includes("地方分権")) return "地方分権改革担当大臣";
        if (standardName.includes("国家戦略特別区域") || standardName.includes("地方創生")) return "地方創生担当大臣";
        if (standardName.includes("地域主権")) return "地域主権推進担当大臣";
        if (standardName.includes("行政刷新")) return "行政刷新担当大臣";
        if (standardName.includes("原子力損害")) return "原子力損害賠償・廃炉等支援機構担当大臣";
        if (standardName.includes("原子力行政")) return "原子力行政担当大臣";
        if (standardName.includes("原子力防災")) return "原子力防災担当大臣";
        if (standardName.includes("アイヌ")) return "アイヌ施策担当大臣";
        if (standardName.includes("人工知能")) return "人工知能戦略担当大臣";
        if (standardName.includes("経済安全保障")) return "経済安全保障担当大臣";
        if (standardName.includes("宇宙")) return "宇宙政策担当大臣";
        if (standardName.includes("海洋")) return "海洋政策担当大臣";
        if (standardName.includes("産業再生")) return "産業再生機構担当大臣";
        if (standardName.includes("個人情報")) return "個人情報保護担当大臣";
        if (standardName.includes("マイナンバー")) return "マイナンバー制度担当大臣";
        if (standardName.includes("クールジャパン")) return "クールジャパン戦略担当大臣";
        if (standardName.includes("知的財産")) return "知的財産戦略担当大臣";
        return '内閣府特命担当大臣';
    }

    if (standardName.includes("行政改革")) return "国務大臣（行政改革担当）";
    if (standardName.includes("公務員制度改革")) return "国務大臣（公務員制度改革担当）";
    if (standardName.includes("感染症危機管理")) return "国務大臣（感染症危機管理担当）";
    if (standardName.includes("国家戦略")) return "国務大臣（国家戦略担当）";
    if (standardName.includes("オリンピック") || standardName.includes("パラリンピック")) return OLYPARA_BASE_NAME;

   

    if (standardName === "経済財政政策担当大臣") return "経済財政政策担当大臣";
    if (standardName === "金融担当大臣") return "金融担当大臣";
    if (standardName === "男女共同参画担当大臣") return "男女共同参画担当大臣";
    if (standardName === "産業再生機構担当大臣") return "産業再生機構担当大臣";
    if (standardName === "個人情報保護担当大臣") return "個人情報保護担当大臣";
    
    if (standardName.startsWith('国務大臣')) return '国務大臣';
    if (standardName.startsWith('班列')) return '班列';
    
    return standardName.replace(/\s*\([^)]*\)$/, '').trim();
};

const getPostCategory = (entry) => {
    const postName = entry.PostName;
    const cabinetName = entry.CabinetName || "";
    const baseName = standardizePostName(postName);

    if (cabinetName.includes('党')) return CAT_PARTY;
    if (PARTY_ROLE_BASE_NAMES_SET.has(baseName)) return CAT_PARTY;
    if (postName.includes('知事') || postName.includes('市長') || postName.includes('村長')) return CAT_LOCAL;
    if (postName.endsWith('議長') || postName.includes('常任委員長')) return CAT_DIET;
    return CAT_CABINET;
};

const getConsolidatedRowKey = (basePostName) => {
    if (basePostName === '衆議院議長') return '衆議院議長';
    if (basePostName === '参議院議長') return '参議院議長';
    if (basePostName === LDP_SOSAI_KEY) return LDP_SOSAI_KEY;
    if (basePostName === LDP_FUKUSOSAI_KEY) return LDP_FUKUSOSAI_KEY;
    if (basePostName === LDP_KANJICHO_KEY) return LDP_KANJICHO_KEY;
    if (basePostName === LDP_SOMUKAICHO_KEY) return LDP_SOMUKAICHO_KEY;
    if (basePostName === LDP_SEICHOKAICHO_KEY) return LDP_SEICHOKAICHO_KEY;
    if (basePostName === LDP_KOKUTAIIINCHO_KEY) return LDP_KOKUTAIIINCHO_KEY;
    if (basePostName === LDP_SENTAI_IINCHO_KEY) return LDP_SENTAI_IINCHO_KEY;
    if (basePostName === LDP_KANJICHO_DAIKO_KEY) return LDP_KANJICHO_DAIKO_KEY;
    if (basePostName === LDP_SAN_GIIN_KAICHO_KEY) return LDP_SAN_GIIN_KAICHO_KEY;

    if (basePostName === '文部大臣' || basePostName === '文部科学大臣') return MEXT_ROW_KEY; 
    if (basePostName === '農商務大臣' || basePostName === '農林大臣' || basePostName === '農林水産大臣') return AGRI_ROW_KEY; 
    if (basePostName === '防衛庁長官' || basePostName === '防衛大臣') return DEFENSE_ROW_KEY; 
    if (basePostName === '経済財政政策担当大臣') return KEIZAI_ZAIMU_ROW_KEY; 
    if (basePostName === '金融担当大臣') return KINYU_ROW_KEY;
    if (basePostName === OLYPARA_BASE_NAME) return OLYPARA_BASE_NAME;

    if (basePostName === '沖縄及び北方対策担当大臣') return OKINAWA_ROW_KEY;
    if (basePostName === '科学技術政策担当大臣') return KAGAKU_ROW_KEY;
    if (basePostName === '規制改革担当大臣') return KISEI_ROW_KEY;
    if (basePostName === '防災担当大臣') return BOUSAI_ROW_KEY;
    if (basePostName === '少子化・男女共同参画担当大臣' || basePostName === '男女共同参画担当大臣') return SHOSHIKA_DANJO_ROW_KEY;
    if (basePostName === '消費者及び食品安全担当大臣') return SHOKUHIN_ROW_KEY;
    if (basePostName === '宇宙政策担当大臣') return UCHU_ROW_KEY;
    if (basePostName === '海洋政策担当大臣') return KAIYO_ROW_KEY;
    if (basePostName === '産業再生機構担当大臣') return SANGYO_SAISEI_ROW_KEY;
    if (basePostName === '個人情報保護担当大臣') return KOJIN_JOHO_ROW_KEY;
    if (basePostName === 'マイナンバー制度担当大臣') return MYNUMBER_ROW_KEY;
    if (basePostName === 'クールジャパン戦略担当大臣') return COOLJAPAN_ROW_KEY;
    if (basePostName === '知的財産戦略担当大臣') return CHITEKI_ZAISAN_ROW_KEY;
    
    if (basePostName === '「新しい公共」担当大臣') return ATARASHII_KOKYO_ROW_KEY;
    if (basePostName === '地方分権改革担当大臣') return CHIHOBUNKEN_ROW_KEY;
    if (basePostName === '地方創生担当大臣') return CHIHOBUNKEN_ROW_KEY; 
    if (basePostName === '地域主権推進担当大臣') return CHIIKISHUKEN_ROW_KEY;
    if (basePostName === '行政刷新担当大臣') return GYOSEI_SASSIN_ROW_KEY;
    if (basePostName === '原子力損害賠償・廃炉等支援機構担当大臣') return GENSHIRYOKU_SONGAI_ROW_KEY;
    if (basePostName === '原子力行政担当大臣') return GENSHIRYOKU_GYOSEI_ROW_KEY;
    if (basePostName === '原子力防災担当大臣') return GENSHIRYOKU_BOUSAI_ROW_KEY;
    if (basePostName === 'アイヌ施策担当大臣') return AINU_ROW_KEY;
    if (basePostName === '人工知能戦略担当大臣') return AI_ROW_KEY;
    if (basePostName === '経済安全保障担当大臣') return KEIZAI_ANZEN_HOSHO_ROW_KEY;
    
    return basePostName;
};

const getBasePostName = (uniquePostName) => {
    if (uniquePostName.startsWith(STACK_KEY_TOKUMEI)) return '内閣府特命担当大臣';
    if (uniquePostName.startsWith(STACK_KEY_KOKUMU)) return '国務大臣';
    if (uniquePostName.startsWith(STACK_KEY_HANRETSU)) return '班列';
    if (uniquePostName.startsWith(STACK_KEY_DEPUTY)) return '内閣官房副長官';
    if (uniquePostName === '衆議院議長') return '衆議院議長';
    if (uniquePostName === '参議院議長') return '参議院議長';
    if (uniquePostName.startsWith(LDP_SOSAI_KEY)) return LDP_SOSAI_KEY;
    if (uniquePostName.startsWith(MEXT_ROW_KEY)) return '文部科学大臣'; 
    if (uniquePostName.startsWith(AGRI_ROW_KEY)) return '農林水産大臣'; 
    if (uniquePostName.startsWith(DEFENSE_ROW_KEY)) return '防衛大臣'; 
    return uniquePostName;
};

const isShunin = (postName) => {
    if (!postName) return false;
    const basePost = postName.replace(/\s*\([^)]*\)$/, '').trim();
    return SHUNIN_POSTS.includes(basePost);
};

const isShuninPost = (postName) => {
    if (!postName) return false;
    const cleanName = postName.replace(/\(.*\)/, '').trim();
    if (SHUNIN_POSTS.includes(cleanName)) return true;
    if (cleanName.endsWith('大臣') && !cleanName.startsWith('内閣府特命') && !cleanName.startsWith('国務')) return true;
    if (cleanName.endsWith('委員会委員長')) return true;
    return false;
};

const getLdpPresidentName = (targetDate) => {
    const presidents = ministerData.filter(d => standardizePostName(d.PostName) === LDP_SOSAI_KEY);
    const match = presidents.find(p => {
        const start = new Date(p.AppointmentDate);
        let endStr = p.ResignationDate;
        let end;
        if (!endStr || new Date(endStr) > TODAY) {
            end = TODAY;
        } else {
            end = new Date(endStr);
        }
        return targetDate >= start && targetDate <= end;
    });
    return match ? match.PersonName : "";
};

// --- データ初期処理 ---
const initialProcessedData = ministerData
    .filter(d => d && d.PostName && !d.PostName.includes('臨時代理') && !d.PostName.includes('事務取扱'))
    .map((d, index) => {
        let rawResign = d.ResignationDate;
        let isIncumbent = false;
        let endDateObj;

        // 現職判定ロジック
        if (!rawResign) {
            isIncumbent = true;
            endDateObj = TODAY;
        } else {
            let tempDate = new Date(rawResign);
            if (tempDate > TODAY) {
                isIncumbent = true;
                endDateObj = TODAY;
            } else {
                endDateObj = tempDate;
            }
        }

        return {
            ...d,
            AppointmentDate: new Date(d.AppointmentDate),
            ResignationDate: endDateObj, 
            originalIndex: index, 
            kenninInfo: [], 
            isAbsorbed: false,
            isIncumbent: isIncumbent 
        };
    });

// --- 兼任・吸収ロジック (メインチャート用) ---
for (let i = 0; i < initialProcessedData.length; i++) {
    const entryA = initialProcessedData[i];
    if (entryA.isAbsorbed) continue; 

    for (let j = i + 1; j < initialProcessedData.length; j++) {
        const entryB = initialProcessedData[j];
        if (entryB.isAbsorbed) continue;

        if (getPostCategory(entryA) !== getPostCategory(entryB)) continue;

        // 【修正】IDが存在する場合はIDで、無ければ名前で同一人物か判定する
        const isSamePerson = (entryA.PersonID && entryB.PersonID)
            ? (entryA.PersonID === entryB.PersonID)
            : (entryA.PersonName === entryB.PersonName);

        if (isSamePerson) {
             // 【追加】内閣官房副長官は別人なのでマージ処理をスキップする
            if (entryA.PostName.includes("内閣官房副長官") || entryB.PostName.includes("内閣官房副長官")) {
                continue; 
            }

            const overlap = entryA.AppointmentDate < entryB.ResignationDate && 
                            entryA.ResignationDate > entryB.AppointmentDate;

            if (overlap) {
                let shuninEntry = null; 
                let kenninEntry = null;
                const aBaseName = standardizePostName(entryA.PostName);
                const bBaseName = standardizePostName(entryB.PostName);
                
                const aIsShunin = isShunin(entryA.PostName);
                const bIsShunin = isShunin(entryB.PostName);

                if (aIsShunin && bIsShunin) {
                    continue; 
                }

                if (ABSORB_TARGETS.includes(aBaseName) && !ABSORB_TARGETS.includes(bBaseName)) {
                    shuninEntry = entryB; kenninEntry = entryA; 
                } else if (!ABSORB_TARGETS.includes(aBaseName) && ABSORB_TARGETS.includes(bBaseName)) {
                    shuninEntry = entryA; kenninEntry = entryB; 
                } else {
                    if (aIsShunin && !bIsShunin) {
                        shuninEntry = entryA; kenninEntry = entryB; 
                    } else if (!aIsShunin && bIsShunin) {
                        shuninEntry = entryB; kenninEntry = entryA; 
                    } else {
                        if (aBaseName === OLYPARA_BASE_NAME && bBaseName !== OLYPARA_BASE_NAME) {
                             shuninEntry = entryB; kenninEntry = entryA;
                        } else if (aBaseName !== OLYPARA_BASE_NAME && bBaseName === OLYPARA_BASE_NAME) {
                             shuninEntry = entryA; kenninEntry = entryB;
                        } else {
                             if (entryA.originalIndex < entryB.originalIndex) {
                                 shuninEntry = entryA; kenninEntry = entryB;
                             } else {
                                 shuninEntry = entryB; kenninEntry = entryA;
                             }
                        }
                    }
                }
                if (shuninEntry && kenninEntry) {
                    shuninEntry.kenninInfo.push(kenninEntry.PostName);
                    kenninEntry.isAbsorbed = true;
                }
            }
        }
    }
}

const finalProcessedData = initialProcessedData
    .filter(d => !d.isAbsorbed) 
    .map(d => {
        const rawPostName = d.PostName.trim();
        const basePostName = standardizePostName(rawPostName); 
        const consolidatedRowKey = getConsolidatedRowKey(basePostName);

        let uniquePostName = consolidatedRowKey;
        let displayPostName = consolidatedRowKey; 

        if (basePostName === OLYPARA_BASE_NAME) {
            uniquePostName = OLYPARA_BASE_NAME;
            displayPostName = OLYPARA_BASE_NAME; 
        }
        else if (basePostName === '国務大臣' || basePostName === '班列' || basePostName === '内閣府特命担当大臣') {
            let match = rawPostName.match(/\(([^)]+)\)/);
            let postDetail = match ? match[1] : null;
            if (postDetail === '無任所') postDetail = null;

            if (postDetail) {
                uniquePostName = rawPostName; 
                displayPostName = rawPostName;
            } else {
                uniquePostName = basePostName; 
                displayPostName = basePostName;
            }
        } else {
            uniquePostName = consolidatedRowKey;
            displayPostName = basePostName; 
        }
        
        // 内閣官房副長官はそのままのPostNameを使用し、displayPostNameもそのままにする（重複回避のため）
        if (rawPostName.includes('内閣官房副長官')) {
            uniquePostName = rawPostName;
            displayPostName = rawPostName;
        }

        return {
            ...d,
            StandardPostName: uniquePostName, 
            DisplayPostName: displayPostName,  
            BasePostName: basePostName,        
        };
    });

const findAvailableLane = (entry, lanes) => {
    const entryStart = entry.AppointmentDate;
    const entryEnd = entry.ResignationDate;
    for (let i = 0; i < lanes.length; i++) {
        const lane = lanes[i];
        let hasOverlap = false;
        for (const tenure of lane) {
            if (entryStart < tenure.end && entryEnd > tenure.start) {
                hasOverlap = true; break; 
            }
        }
        if (!hasOverlap) {
            lane.push({ start: entryStart, end: entryEnd });
            return i;
        }
    }
    lanes.push([{ start: entryStart, end: entryEnd }]);
    return lanes.length - 1; 
};

const tokumeiRowKeys = [
    KEIZAI_ZAIMU_ROW_KEY, KINYU_ROW_KEY,
    OKINAWA_ROW_KEY, KAGAKU_ROW_KEY, KISEI_ROW_KEY, BOUSAI_ROW_KEY,
    SHOSHIKA_DANJO_ROW_KEY, SHOKUHIN_ROW_KEY, UCHU_ROW_KEY, KAIYO_ROW_KEY,
    SANGYO_SAISEI_ROW_KEY, KOJIN_JOHO_ROW_KEY, MYNUMBER_ROW_KEY,
    COOLJAPAN_ROW_KEY, CHITEKI_ZAISAN_ROW_KEY,
    ATARASHII_KOKYO_ROW_KEY, CHIHOBUNKEN_ROW_KEY, CHIIKISHUKEN_ROW_KEY,
    GYOSEI_SASSIN_ROW_KEY, GENSHIRYOKU_SONGAI_ROW_KEY, GENSHIRYOKU_GYOSEI_ROW_KEY,
    GENSHIRYOKU_BOUSAI_ROW_KEY, AINU_ROW_KEY, AI_ROW_KEY, KEIZAI_ANZEN_HOSHO_ROW_KEY
];

const tokumeiEntries = [];
const kokumuEntries = [];
const hanretsuEntries = [];
const deputyEntries = [];
const otherEntries = [];

finalProcessedData.forEach(d => {
    const baseName = d.BasePostName;
    const standardName = d.StandardPostName; 
    
    if (tokumeiRowKeys.includes(standardName) || baseName === '内閣府特命担当大臣') {
        tokumeiEntries.push(d);
    } else if (baseName === '国務大臣' || baseName === OLYPARA_BASE_NAME) {
        kokumuEntries.push(d);
    } else if (baseName === '班列') {
        hanretsuEntries.push(d);
    } else if (d.PostName.includes('内閣官房副長官')) {
        deputyEntries.push(d);
    } else {
        otherEntries.push(d);
    }
});

const finalLaneProcessedData = [...otherEntries];

const tokumeiLanes = []; 
tokumeiEntries.sort((a, b) => a.AppointmentDate - b.AppointmentDate); 
tokumeiEntries.forEach(entry => {
    const laneIndex = findAvailableLane(entry, tokumeiLanes);
    entry.DisplayPostName = '内閣府特命担当大臣'; 
    if (laneIndex === 0) entry.StandardPostName = STACK_KEY_TOKUMEI; 
    else entry.StandardPostName = `${STACK_KEY_TOKUMEI}_${laneIndex}`; 
    finalLaneProcessedData.push(entry);
});

const kokumuLanes = [];
kokumuEntries.sort((a, b) => a.AppointmentDate - b.AppointmentDate);
kokumuEntries.forEach(entry => {
    const laneIndex = findAvailableLane(entry, kokumuLanes);
    entry.DisplayPostName = '国務大臣'; 
    if (laneIndex === 0) entry.StandardPostName = STACK_KEY_KOKUMU;
    else entry.StandardPostName = `${STACK_KEY_KOKUMU}_${laneIndex}`;
    finalLaneProcessedData.push(entry);
});

const hanretsuLanes = [];
hanretsuEntries.sort((a, b) => a.AppointmentDate - b.AppointmentDate);
hanretsuEntries.forEach(entry => {
    const laneIndex = findAvailableLane(entry, hanretsuLanes);
    entry.DisplayPostName = '班列';
    if (laneIndex === 0) entry.StandardPostName = STACK_KEY_HANRETSU;
    else entry.StandardPostName = `${STACK_KEY_HANRETSU}_${laneIndex}`;
    finalLaneProcessedData.push(entry);
});

const deputyLanes = [];
deputyEntries.sort((a, b) => a.AppointmentDate - b.AppointmentDate);
deputyEntries.forEach(entry => {
    const laneIndex = findAvailableLane(entry, deputyLanes);
    // スタックキーを使わず、そのままの役職名を使用する
    // entry.DisplayPostName = '内閣官房副長官'; 
    // entry.StandardPostName = `${STACK_KEY_DEPUTY}_${laneIndex}`; 
    finalLaneProcessedData.push(entry);
});

const processedData = finalLaneProcessedData;

const primeMinisters = new Set();
processedData.forEach(d => {
    if (d.PostName.startsWith('内閣総理大臣')) {
        primeMinisters.add(d.PersonName); // 名前で登録
    }
});

// PM用の基本色相を保存するマップ
const pmHueMap = new Map();
const goldenAngle = 137.5; 
let baseHue = Math.random() * 360; 

Array.from(primeMinisters).forEach((personName, index) => {
    const hue = (baseHue + (index * goldenAngle)) % 360;
    pmHueMap.set(personName, hue); // 名前でセット
});

const hasData = processedData.length > 0;
const minDate = hasData 
    ? processedData.reduce((min, d) => d.AppointmentDate < min ? d.AppointmentDate : min, processedData[0].AppointmentDate)
    : new Date("1885/12/22"); 
const maxDate = hasData 
    ? processedData.reduce((max, d) => d.ResignationDate > max ? d.ResignationDate : max, processedData[0].ResignationDate)
    : new Date("1885/12/23"); 

let totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
let calculatedWidth = totalDays * SCALING_FACTOR + 500; 

const allUniquePostNames = Array.from(new Set(processedData.map(d => d.StandardPostName)));
const allUniquePosts = allUniquePostNames.map((uniqueName, index) => {
    const records = processedData.filter(d => d.StandardPostName === uniqueName);
    const firstRecord = records[0];
    const allBaseNames = new Set(records.map(d => d.BasePostName));

    if (!firstRecord) {
        const baseName = getBasePostName(uniqueName);
        return { uniqueName: uniqueName, displayName: uniqueName, baseName: baseName, allBaseNames: new Set([baseName]), personName: "Unknown", originalIndex: index };
    }
    
    let displayName = firstRecord.DisplayPostName;
    let baseName = firstRecord.BasePostName;
    if (uniqueName === MEXT_ROW_KEY) { displayName = "文部科学大臣"; baseName = "文部科学大臣"; }
    if (uniqueName === AGRI_ROW_KEY) { displayName = "農林水産大臣"; baseName = "農林水産大臣"; }
    if (uniqueName === DEFENSE_ROW_KEY) { displayName = "防衛大臣"; baseName = "防衛大臣"; }
    
    if (uniqueName.startsWith(STACK_KEY_TOKUMEI) || uniqueName.startsWith(STACK_KEY_KOKUMU) || uniqueName.startsWith(STACK_KEY_HANRETSU)) {
        displayName = firstRecord.DisplayPostName; 
        baseName = allBaseNames.values().next().value; 
    }
    
    // 内閣官房副長官の場合はそのまま
    if (uniqueName.includes('内閣官房副長官')) {
        displayName = uniqueName;
        baseName = uniqueName;
    }

    return {
        uniqueName: uniqueName,
        displayName: displayName, 
        baseName: baseName, 
        allBaseNames: allBaseNames, 
        personName: firstRecord.PersonName, 
        originalIndex: index 
    };
});

const sequenceChangePoints = timeSeriesSequenceData.map(d => ({
    startDate: new Date(d.startDate),
    map: d.postOrderMap 
}));
sequenceChangePoints.sort((a, b) => a.startDate - b.startDate); 

const updateYAxisLabels = (sortSequenceMap, leftEdgeDate, rightEdgeDate) => {
    yAxisLabelsContainer.innerHTML = ''; 
    const activeMaps = [];
    for (let i = 0; i < sequenceChangePoints.length; i++) {
        const point = sequenceChangePoints[i];
        const pointEndDate = (i + 1 < sequenceChangePoints.length) 
            ? new Date(sequenceChangePoints[i+1].startDate.getTime() - 1) 
            : new Date(maxDate);
        if (point.startDate <= rightEdgeDate && pointEndDate >= leftEdgeDate) {
            activeMaps.push(point.map);
        }
    }
    const allActiveRoles = new Set();
    activeMaps.forEach(map => { Object.keys(map).forEach(role => allActiveRoles.add(role)); });

    let currentPosts = allUniquePosts.filter(post => {
        const records = processedData.filter(d => d.StandardPostName === post.uniqueName);
        if (records.length === 0) return false; 
        const postMinApptDate = records.reduce((min, d) => d.AppointmentDate < min ? d.AppointmentDate : min, records[0].AppointmentDate);
        const postMaxResignDate = records.reduce((max, d) => d.ResignationDate > max ? d.ResignationDate : max, records[0].ResignationDate);
        if (postMaxResignDate < leftEdgeDate || postMinApptDate > rightEdgeDate) return false;
        const sampleRecord = records[0];
        const category = getPostCategory(sampleRecord || { PostName: post.baseName });
        
        // フィルター処理追加 (複数選択対応)
        // ------------------------------
        if (!activeCategoryFilters.has(category)) {
            return false;
        }
        // 政党カテゴリがONで、かつ政党名フィルターが'all'でない場合
        if (activeCategoryFilters.has(CAT_PARTY) && category === CAT_PARTY && activePartyFilter !== 'all') {
             if (sampleRecord.CabinetName !== activePartyFilter) return false;
        }
        // ------------------------------

        if (category === CAT_PARTY || category === CAT_DIET || category === CAT_LOCAL) return true;
        let roleExists = false;
        for (const baseName of post.allBaseNames) {
            if (allActiveRoles.has(baseName)) { roleExists = true; break; }
        }
        if (!roleExists) {
            const baseName = getBasePostName(post.uniqueName); 
            if (baseName === "内閣府特命担当大臣" || baseName === "国務大臣" || baseName === "班列" || baseName.includes("内閣官房副長官") || baseName === OLYPARA_BASE_NAME) roleExists = true;
        }
        return roleExists;
    });

    const cabinetPosts = [], dietPosts = [], partyPosts = [], localPosts = [];
    currentPosts.forEach(post => {
        const sampleRecord = processedData.find(d => d.StandardPostName === post.uniqueName);
        const category = getPostCategory(sampleRecord || { PostName: post.baseName });
        if (category === CAT_DIET) dietPosts.push(post);
        else if (category === CAT_PARTY) partyPosts.push(post);
        else if (category === CAT_LOCAL) localPosts.push(post);
        else cabinetPosts.push(post);
    });

    const sortBySequence = (posts) => {
        posts.sort((a, b) => {
            let orderA = 999;
            for (const baseName of a.allBaseNames) { if (sortSequenceMap.hasOwnProperty(baseName)) orderA = Math.min(orderA, sortSequenceMap[baseName]); }
            let orderB = 999;
            for (const baseName of b.allBaseNames) { if (sortSequenceMap.hasOwnProperty(baseName)) orderB = Math.min(orderB, sortSequenceMap[baseName]); }
            if (orderA !== orderB) return orderA - orderB;
            return a.originalIndex - b.originalIndex;
        });
    };
    const sortPartyPosts = (posts) => {
        posts.sort((a, b) => {
            const baseA = getBasePostName(a.uniqueName);
            const baseB = getBasePostName(b.uniqueName);
            const orderA = PARTY_ROLE_ORDER.indexOf(baseA) !== -1 ? PARTY_ROLE_ORDER.indexOf(baseA) : 999;
            const orderB = PARTY_ROLE_ORDER.indexOf(baseB) !== -1 ? PARTY_ROLE_ORDER.indexOf(baseB) : 999;
            if (orderA !== orderB) return orderA - orderB;
            return a.originalIndex - b.originalIndex;
        });
    };

    const deputyPosts = cabinetPosts.filter(p => p.baseName.includes('内閣官房副長官'));
    const normalCabinetPosts = cabinetPosts.filter(p => !p.baseName.includes('内閣官房副長官'));

    sortBySequence(normalCabinetPosts);
    
    const deputyOrder = [
        "内閣官房副長官（政務・衆議院）",
        "内閣官房副長官（政務・参議院）",
        "内閣官房副長官（政務）",
        "内閣官房副長官（事務）"
    ];

    deputyPosts.sort((a, b) => {
        const indexA = deputyOrder.indexOf(a.baseName);
        const indexB = deputyOrder.indexOf(b.baseName);
        const valA = indexA === -1 ? 999 : indexA;
        const valB = indexB === -1 ? 999 : indexB;
        return valA - valB;
    });

    sortBySequence(dietPosts); 
    sortPartyPosts(partyPosts);
    sortBySequence(localPosts);

    yAxisLabelsContainer.innerHTML = '';
    let flattenedUniqueNames = [];

    // 内閣
    if (normalCabinetPosts.length >= 0 || deputyPosts.length > 0) {
        // フィルターが cabinet を含んでいなければ表示しない
        if (activeCategoryFilters.has(CAT_CABINET)) {
            const gapId = SPACER_ID_PREFIX + CAT_CABINET + '_GAP';
            yAxisLabelsContainer.appendChild(createYAxisLabel({ uniqueName: gapId }, sortSequenceMap));
            flattenedUniqueNames.push(gapId);
            const titleId = SPACER_ID_PREFIX + CAT_CABINET + '_TITLE';
            yAxisLabelsContainer.appendChild(createYAxisLabel({ uniqueName: titleId }, sortSequenceMap));
            flattenedUniqueNames.push(titleId);
            
            normalCabinetPosts.forEach(p => {
                yAxisLabelsContainer.appendChild(createYAxisLabel(p, sortSequenceMap));
                flattenedUniqueNames.push(p.uniqueName);
            });

            if (deputyPosts.length > 0) {
                const depGapId = SPACER_DEPUTY_GAP;
                yAxisLabelsContainer.appendChild(createYAxisLabel({ uniqueName: depGapId, displayName: "" }, sortSequenceMap));
                flattenedUniqueNames.push(depGapId);

                deputyPosts.forEach(p => {
                    yAxisLabelsContainer.appendChild(createYAxisLabel(p, sortSequenceMap));
                    flattenedUniqueNames.push(p.uniqueName);
                });
            }
        }
    }

    const appendSection = (posts, catKey) => {
        // フィルターで除外されていたら表示しない
        if (!activeCategoryFilters.has(catKey)) return;
        
        if (posts.length >= 0) {
            const gapId = SPACER_ID_PREFIX + catKey + '_GAP';
            yAxisLabelsContainer.appendChild(createYAxisLabel({ uniqueName: gapId }, sortSequenceMap));
            flattenedUniqueNames.push(gapId);
            const titleId = SPACER_ID_PREFIX + catKey + '_TITLE';
            yAxisLabelsContainer.appendChild(createYAxisLabel({ uniqueName: titleId }, sortSequenceMap));
            flattenedUniqueNames.push(titleId);
            posts.forEach((p, index) => {
                const div = createYAxisLabel(p, sortSequenceMap);
                if (index === 0) div.classList.add('party-role-top-row');
                yAxisLabelsContainer.appendChild(div);
                flattenedUniqueNames.push(p.uniqueName);
            });
        }
    };

    appendSection(dietPosts, CAT_DIET);
    appendSection(partyPosts, CAT_PARTY);
    appendSection(localPosts, CAT_LOCAL);

    yAxisLabelsContainer.style.height = `${flattenedUniqueNames.length * ROW_HEIGHT}px`;
    return flattenedUniqueNames;
};

const createYAxisLabel = (post, sortSequenceMap) => {
    const labelDiv = document.createElement('div');
    if (post.uniqueName === SPACER_DEPUTY_GAP) {
        labelDiv.className = 'y-axis-label spacer-row-gap'; 
        labelDiv.textContent = "";
    } else if (post.uniqueName.startsWith(SPACER_ID_PREFIX)) {
        if (post.uniqueName.endsWith('_GAP')) { labelDiv.className = 'y-axis-label spacer-row-gap'; labelDiv.textContent = ""; } 
        else if (post.uniqueName.endsWith('_TITLE')) { labelDiv.className = 'y-axis-label spacer-row-title'; const cat = post.uniqueName.split('_')[1]; labelDiv.textContent = CAT_TITLES[cat] || ""; }
    } else {
        labelDiv.className = 'y-axis-label';
    }
    labelDiv.style.height = `${ROW_HEIGHT}px`;

    if (!post.uniqueName.startsWith(SPACER_ID_PREFIX) && post.uniqueName !== SPACER_DEPUTY_GAP) {
        if (post.uniqueName === '衆議院議長') labelDiv.textContent = "衆議院議長";
        else if (post.uniqueName === '参議院議長') labelDiv.textContent = "参議院議長";
        else if (post.uniqueName.startsWith(LDP_SOSAI_KEY)) labelDiv.textContent = "総裁";
        else if (post.uniqueName.startsWith(LDP_KANJICHO_DAIKO_KEY)) labelDiv.textContent = "幹事長代行"; 
        else if (post.uniqueName.startsWith(LDP_KANJICHO_KEY)) labelDiv.textContent = "幹事長";
        else if (post.uniqueName === MEXT_ROW_KEY) {
            let dynamicLabel = "文部科学大臣"; 
            if (sortSequenceMap.hasOwnProperty("文部大臣")) dynamicLabel = "文部大臣";
            labelDiv.textContent = dynamicLabel;
        } 
        else if (post.uniqueName === AGRI_ROW_KEY) {
            let dynamicLabel = "農林水産大臣"; 
            if (sortSequenceMap.hasOwnProperty("農商務大臣")) dynamicLabel = "農商務大臣";
            else if (sortSequenceMap.hasOwnProperty("農林大臣")) dynamicLabel = "農林大臣";
            labelDiv.textContent = dynamicLabel;
        } 
        else if (post.uniqueName === DEFENSE_ROW_KEY) {
            let dynamicLabel = "防衛大臣"; 
            if (sortSequenceMap.hasOwnProperty("防衛庁長官")) dynamicLabel = "防衛庁長官";
            labelDiv.textContent = dynamicLabel;
        }
        else if (post.uniqueName.startsWith(STACK_KEY_TOKUMEI) || post.uniqueName.startsWith(STACK_KEY_KOKUMU) || post.uniqueName.startsWith(STACK_KEY_HANRETSU) || post.uniqueName.startsWith(STACK_KEY_DEPUTY)) {
            labelDiv.textContent = post.displayName;
        }
        else {
            if (labelDiv.textContent.length === 0) labelDiv.textContent = post.displayName; 
        }
        
        // 副長官（政務）の文字を小さくする
        if (labelDiv.textContent.includes('内閣官房副長官（政務・')) {
            labelDiv.style.fontSize = '10px';
            labelDiv.style.lineHeight = '1.2';
        }

        const isClickable = !post.uniqueName.startsWith(STACK_KEY_TOKUMEI) && !post.uniqueName.startsWith(STACK_KEY_KOKUMU) && !post.uniqueName.startsWith(STACK_KEY_HANRETSU) && !post.uniqueName.startsWith(STACK_KEY_DEPUTY) && !post.uniqueName.startsWith(SPACER_ID_PREFIX);
        if (isClickable) {
            labelDiv.classList.add('clickable');
            labelDiv.addEventListener('click', () => openRoleRankingSidebar(post));
        }
    }
    return labelDiv;
};

const isTargetPerson = (record, targetId, targetName) => {
    const distinctNames = ["吉田茂", "山村新治郎", "鈴木俊一"];
    if (distinctNames.includes(targetName)) {
        return record.PersonName === targetName && record.PersonID === targetId;
    } else {
        return record.PersonName === targetName;
    }
};

// --- 詳細サイドバー表示ロジック (刷新) ---

function openSidebar(personId, personName) {
    if (!detailsSidebar || !sidebarTitle || !sidebarContent) return;

    sidebarTitle.innerHTML = `${personName} <a href="https://ja.wikipedia.org/wiki/${personName}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; margin-left: 5px; font-size: 0.8em;">🔗</a>`;
    sidebarContent.innerHTML = ''; 

    // 1. データ抽出・ソート
    let rawRoles = initialProcessedData.filter(d => 
        isTargetPerson(d, personId, personName)
    ).map(d => ({
        ...d,
        startDate: d.AppointmentDate,
        endDate: d.ResignationDate,
        displayPostName: d.PostName, // 初期値
        isPM: d.PostName.startsWith('内閣総理大臣'),
        category: getPostCategory(d),
        concurrentNotes: [], 
        isHidden: false 
    }));

    if (rawRoles.length === 0) {
        sidebarContent.innerHTML = '<div style="padding:20px;">データがありません</div>';
        detailsSidebar.classList.add('open');
        globalOverlay.classList.add('open');
        return;
    }

    rawRoles.sort((a, b) => a.startDate - b.startDate);

    // 2. データ統合・整形処理
    const mergedRoles = [];
    const processedIndices = new Set();

    // 総理在任期間リスト
    const pmTerms = rawRoles.filter(r => r.isPM).map(r => ({
        start: r.startDate,
        end: r.endDate,
        obj: r
    }));

    for (let i = 0; i < rawRoles.length; i++) {
        if (processedIndices.has(i)) continue;
        let role = { ...rawRoles[i] };
        processedIndices.add(i);

        // 【修正】データ内の組織名(CabinetName)を参照して党名を付与
        if (role.category === CAT_PARTY) {
             // データから党名を取得（例："自由民主党"、"民主党"など）
             const partyName = role.CabinetName || ""; 
             
             // 党名が存在し、かつ役職名の先頭にまだ付いていない場合のみ付与
             if (partyName && !role.displayPostName.startsWith(partyName)) {
                 role.displayPostName = partyName + ' ' + role.displayPostName;
             }
        }

        // 【要件7】特命担当大臣の表記調整（単体）
        if (role.displayPostName.startsWith('内閣府特命担当大臣')) {
            const topic = extractTopic(role.displayPostName);
            if (topic) {
                role.displayPostName = `内閣府特命担当大臣（${topic}）`;
                role.tokumeiTopics = [topic]; 
            }
        }

        // 同一期間マージ処理
        for (let j = i + 1; j < rawRoles.length; j++) {
            if (processedIndices.has(j)) continue;
            const nextRole = rawRoles[j];

            // 期間が完全一致（24時間以内の誤差許容）
            const isSameStart = Math.abs(role.startDate - nextRole.startDate) < 86400000;
            const isSameEnd = Math.abs(role.endDate - nextRole.endDate) < 86400000;

            if (isSameStart && isSameEnd) {
                processedIndices.add(j); // マージ対象とする

                const roleIsShunin = isShuninPost(role.PostName);
                const nextIsShunin = isShuninPost(nextRole.PostName);
                const roleIsTokumei = role.PostName.startsWith('内閣府特命担当大臣');
                const nextIsTokumei = nextRole.PostName.startsWith('内閣府特命担当大臣');

                // ケースA: 特命同士
                if (roleIsTokumei && nextIsTokumei) {
                    const nextTopic = extractTopic(nextRole.PostName);
                    if (role.tokumeiTopics && nextTopic) {
                        role.tokumeiTopics.push(nextTopic);
                        role.displayPostName = `内閣府特命担当大臣（${role.tokumeiTopics.join('、')}）`;
                    }
                }
                // ケースB: 主任 + 特命 -> 主任に吸収し併記 (要件9, Q3:B案)
                else if (roleIsShunin && nextIsTokumei) {
                    const nextTopic = extractTopic(nextRole.PostName);
                    if (role.displayPostName.includes('内閣府特命担当大臣')) {
                         role.displayPostName = role.displayPostName.replace('）', `、${nextTopic}）`);
                    } else {
                         role.displayPostName = `${role.PostName} 兼 内閣府特命担当大臣（${nextTopic}）`;
                    }
                }
                else if (roleIsTokumei && nextIsShunin) {
                    const roleTopic = extractTopic(role.PostName);
                    role.PostName = nextRole.PostName; 
                    role.displayPostName = `${nextRole.PostName} 兼 内閣府特命担当大臣（${roleTopic}）`;
                    role.category = getPostCategory(nextRole);
                }
                // ケースC: 主任 + 主任 -> 連結 (要件8)
                else {
                    role.displayPostName = `${role.displayPostName} 兼 ${nextRole.displayPostName}`;
                }
            }
        }
        for (let k = i + 1; k < rawRoles.length; k++) {
            if (processedIndices.has(k)) continue; // 既に処理済ならスキップ
            const target = rawRoles[k];

            // 条件: ターゲットの開始日が現在の役職の期間中にあり、かつ開始日が遅いこと
            if (target.startDate > role.startDate && target.startDate < role.endDate) {
                
                const roleIsShunin = isShuninPost(role.PostName);
                const roleIsTokumei = role.PostName.startsWith('内閣府特命担当大臣');
                const targetIsTokumei = target.PostName.startsWith('内閣府特命担当大臣');
                
                let noteText = null;
                // 日付フォーマット (yyyy/mm/dd)
                const dateStr = `${target.startDate.getFullYear()}/${target.startDate.getMonth() + 1}/${target.startDate.getDate()}`;

                // ケースA: 主任大臣(role) が 途中から 特命(target) を兼任
                if (roleIsShunin && targetIsTokumei) {
                    const topic = extractTopic(target.PostName) || "";
                    noteText = `${dateStr}より内閣府特命担当大臣（${topic}）を兼任`;
                }
                // ケースB: 特命(role) が 途中から 別の特命(target) を兼任
                else if (roleIsTokumei && targetIsTokumei) {
                    const topic = extractTopic(target.PostName) || "";
                    noteText = `${dateStr}より${topic}担当を兼任`;
                }

                if (noteText) {
                    // 親データに注記を追加
                    if (!role.concurrentNotes) role.concurrentNotes = [];
                    role.concurrentNotes.push(noteText);
                    
                    // 吸収される側(target)は非表示にするため、処理済インデックスに追加
                    processedIndices.add(k);
                }
            }
        }
        // 【要件5, 6】総理大臣との兼任チェック
        if (!role.isPM) {
            for (const term of pmTerms) {
                // 期間内判定
                if (role.startDate >= term.start && role.endDate <= term.end) {
                    // 【要件6】総理就任前から継続しているか（代数変更なし）
                    const isPreExisting = role.startDate.getTime() < term.start.getTime();
                    
                    if (isPreExisting) {
                        // 例外：レーンを分けるため、ここでは何もしない
                    } else {
                        // 【要件5】総理就任中または同時に就任 -> 非表示にして注釈
                        role.isHidden = true;
                        const period = formatConcurrentPeriod(role.startDate, role.endDate, role.isIncumbent);
                        term.obj.concurrentNotes.push(`※${period}まで${role.displayPostName}を兼任`);
                    }
                }
            }
        }
        
        // 党役職の総裁名付記
        if (role.category === CAT_PARTY && role.PostName !== '総裁' && role.PostName !== '総裁 (代行)') {
            const president = getLdpPresidentName(role.startDate);
            if (president) {
                role.presidentInfo = `総裁：${president}`;
            }
        }

        if (!role.isHidden) {
            mergedRoles.push(role);
        }
    }

    // 3. レーン配置計算 & HTML生成
    const blocks = [];
    let currentBlock = null;

    mergedRoles.forEach(role => {
        let isNewBlock = false;
        if (!currentBlock) {
            isNewBlock = true;
        } else {
            // 1年以上の空白はブロック分割
            if (role.startDate.getTime() - currentBlock.end.getTime() > 365 * 24 * 60 * 60 * 1000) {
                isNewBlock = true;
            }
        }

        if (isNewBlock) {
            if (currentBlock) {
                blocks.push(currentBlock);
                if (role.startDate > currentBlock.end) {
                    blocks.push({ type: 'spacer', start: currentBlock.end, end: role.startDate });
                }
            }
            currentBlock = {
                type: 'roles',
                start: role.startDate,
                end: role.endDate,
                items: [role]
            };
        } else {
            currentBlock.items.push(role);
            if (role.endDate > currentBlock.end) {
                currentBlock.end = role.endDate;
            }
        }
    });
    if (currentBlock) blocks.push(currentBlock);

    // 1. 線の終点を制御する変数を定義（初期値20pxは下部のpadding分）
    let lineEndOffset = 20; 
    
    // 2. スタイル属性にプレースホルダー {{OFFSET}} を仕込んでおく
    let html = '<div class="sidebar-timeline-container" style="--line-end-offset: {{OFFSET}}px;">';

    blocks.forEach((block, index) => {
        const durationMs = block.end - block.start;
        const days = durationMs / (1000 * 60 * 60 * 24);
        let blockPixelHeight = Math.floor(days * SIDEBAR_SCALE_PX_PER_DAY); 
        if (blockPixelHeight < MIN_BLOCK_HEIGHT && block.type === 'roles') blockPixelHeight = MIN_BLOCK_HEIGHT;

        if (block.type === 'spacer') {
             if (blockPixelHeight < 20) blockPixelHeight = 20;
             html += `<div class="timeline-spacer" style="height:${blockPixelHeight}px;">
                        <div class="timeline-center"></div>
                      </div>`;
        } else {
            const laidOutItems = layoutItemsInBlock(block.items, block.start, block.end, blockPixelHeight);
            
            // テキスト位置の衝突回避ロジック
            let currentTextY = 0;
            // layoutItemsInBlockで返されるアイテムは配置順ではない可能性があるため、topPx順にソート
            laidOutItems.sort((a, b) => a.topPx - b.topPx);
            
            laidOutItems.forEach(item => {
                // テキストの高さを概算: タイトル行(20) + 内閣名行(15) + 総裁情報(15) + 備考(行数*15) + 余白(10)
                let noteCount = item.role.concurrentNotes ? item.role.concurrentNotes.length : 0;
                let hasPresident = item.role.presidentInfo ? 1 : 0;
                let estimatedHeight = 35 + (hasPresident * 15) + (noteCount * 15) + 10; 
                
                let desiredTop = item.topPx;
                // 直前の要素の下端よりも上にある場合は押し下げる
                if (desiredTop < currentTextY) {
                    desiredTop = currentTextY + 3; // 3pxのマージン
                }
                item.textTopPx = desiredTop;
                currentTextY = desiredTop + estimatedHeight;
            });
            
            // ブロックの高さを、テキストの最終位置に合わせて拡張する
            const maxTextBottom = currentTextY;
            const contentHeight = Math.max(blockPixelHeight, maxTextBottom + 20);
            
            // 最後のブロックかつ現職を含む場合、線の終点をこのブロックの開始位置（上端）にする
            if (index === blocks.length - 1 && block.type === 'roles') {
                const hasIncumbent = block.items.some(item => item.isIncumbent);
                if (hasIncumbent) {
                    // padding-bottom(20px) + ブロックの高さ 分だけ下から短くする
                    lineEndOffset = 20 + contentHeight;
                }
            }
            
            let barsHtml = '';
            let textsHtml = '';
            let leftLabelsHtml = '';

            // 日付ラベル生成
            const dateLabels = [];
            laidOutItems.forEach(item => {
                 dateLabels.push({ date: item.role.startDate, type: 'start', top: item.topPx, text: formatDateJP(item.role.startDate) });
                 dateLabels.push({ date: item.role.endDate, type: 'end', top: item.topPx + item.heightPx, text: item.role.isIncumbent ? "現職" : formatDateJP(item.role.endDate) });
            });
            
            dateLabels.sort((a,b) => a.top - b.top);
            let lastTop = -999;
            dateLabels.forEach(lbl => {
                if (Math.abs(lbl.top - lastTop) > 12) { 
                     let styleTop = lbl.type === 'start' ? `top: ${lbl.top}px;` : `top: ${lbl.top}px; transform: translateY(-100%);`;
                     if (lbl.type === 'start') styleTop = `top: ${lbl.top}px;`; 
                     leftLabelsHtml += `<div class="timeline-date-label" style="${styleTop}">${lbl.text}</div>`;
                     lastTop = lbl.top;
                }
            });

            laidOutItems.forEach(item => {
                const role = item.role;
                const cat = role.category;
                
                let barClass = 'timeline-bar';
                if (cat === CAT_CABINET) barClass += ' bar-cabinet';
                if (cat === CAT_PARTY) barClass += ' bar-party';
                if (cat === CAT_DIET) barClass += ' bar-diet';
                if (cat === CAT_LOCAL) barClass += ' bar-local';
                if (role.isPM) barClass += ' highlight-pm';
                if (role.isIncumbent) barClass += ' incumbent';
                
                // 【要件1, Q1】1pxの隙間 -> heightから1px引く
                let displayHeight = Math.max(1, item.heightPx - 1); 
                
                const laneLeft = item.lane * 14;
                
                barsHtml += `<div class="${barClass}" style="top:${item.topPx}px; height:${displayHeight}px; left:${laneLeft}px; border-radius:3px;" title="${role.displayPostName}"></div>`;

                let meta = role.CabinetName || "";
                if (cat === CAT_PARTY) meta = ""; // 党の場合は内閣名（"自由民主党"）を表示しない

                let presidentHtml = "";
                if (role.presidentInfo) {
                    presidentHtml = `<div class="president-info">${role.presidentInfo}</div>`;
                }
                
                let notes = "";
                if (role.concurrentNotes && role.concurrentNotes.length > 0) {
                    notes = role.concurrentNotes.map(n => `<div style="font-size:0.8em; color:#666;">${n}</div>`).join("");
                }

                const deputyTag = role.isDeputyPM ? ' <span class="role-deputy">副総理</span>' : '';
                const pmStyle = role.isPM ? 'font-weight:bold; font-size:1.1em; color:#c0392b;' : '';

                textsHtml += `
                    <div class="timeline-text-item" style="top:${item.textTopPx}px; padding-left: ${(item.maxLane + 1) * 14 + 5}px;">
                        <div class="timeline-role-name" style="${pmStyle}">${role.displayPostName}${deputyTag}</div>
                        <div class="timeline-cabinet-name">${meta}</div>
                        ${presidentHtml}
                        ${notes}
                    </div>
                `;
            });

            html += `
                <div class="timeline-block" style="height: ${contentHeight}px;">
                    <div class="timeline-left">${leftLabelsHtml}</div>
                    <div class="timeline-center" style="position:relative; width: 50px;">
                        ${barsHtml}
                    </div>
                    <div class="timeline-right">${textsHtml}</div>
                </div>
            `;
        }
    });

    // 計算したオフセット値をHTMLに適用
    html = html.replace('{{OFFSET}}', lineEndOffset);

    html += '</div>';
    sidebarContent.innerHTML = html;
    detailsSidebar.classList.add('open');
    globalOverlay.classList.add('open');
}

// --- レイアウト計算ロジック ---
function layoutItemsInBlock(roles, blockStart, blockEnd, blockPixelHeight) {
    const msToPx = (ms) => {
        return (ms / (blockEnd.getTime() - blockStart.getTime())) * blockPixelHeight;
    };

    const items = []; 
    const laneEndsPx = []; 

    roles.forEach(role => {
        const startMs = role.startDate.getTime() - blockStart.getTime();
        const durationMs = role.endDate.getTime() - role.startDate.getTime();
        let topPx = msToPx(startMs);
        let heightPx = msToPx(durationMs);
        if (heightPx < 2) heightPx = 2;

        let assignedLane = -1;

        // 【要件4】総理と総裁の兼任制御
        const isPM = role.PostName === "内閣総理大臣";
        const isSosai = role.PostName === LDP_SOSAI_KEY;
        
        if (isPM || isSosai) {
            const overlapPartner = items.find(it => {
                const itIsPM = it.role.PostName === "内閣総理大臣";
                const itIsSosai = it.role.PostName === LDP_SOSAI_KEY;
                if (!itIsPM && !itIsSosai) return false;
                const itStart = it.topPx;
                const itEnd = it.topPx + it.heightPx;
                const myStart = topPx;
                const myEnd = topPx + heightPx;
                return (myStart < itEnd && myEnd > itStart); 
            });

            if (overlapPartner) {
                // 総理=Lane0, 総裁=Lane1
                if (isPM) {
                    assignedLane = 0;
                    if (overlapPartner.lane === 0) overlapPartner.lane = 1;
                } else if (isSosai) {
                    assignedLane = 1;
                    if (overlapPartner.role.PostName === "内閣総理大臣" && overlapPartner.lane !== 0) {
                        overlapPartner.lane = 0;
                    }
                }
            }
        }

        // 通常配置ロジック
        if (assignedLane === -1) {
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            let firstAvailableLane = -1;

            for (let l = 0; l <= laneEndsPx.length; l++) {
                const prevItem = items.filter(it => it.lane === l).pop();
                
                if (!prevItem) {
                    if (firstAvailableLane === -1) firstAvailableLane = l;
                    break;
                }

                const prevEndMs = prevItem.role.endDate.getTime() - blockStart.getTime();
                const myStartMs = startMs; 
                const gapMs = myStartMs - prevEndMs;

                if (gapMs >= 0) {
                    // 完全に時間が後 -> 配置OK
                    if (firstAvailableLane === -1) firstAvailableLane = l;
                } else {
                    // 時間が被っている (gapMs < 0)
                    // 【要件2】同日交代 (gap=0 の判定だが浮動小数誤差も考慮し gapMs >= -10000程度なら許容)
                    // 【要件3】内閣⇔党 かつ 重複が7日以内なら同一レーン
                    
                    const absGap = Math.abs(gapMs);
                    const isSameDaySwap = absGap < 43200000; // 半日以内なら同日交代とみなす
                    
                    const isCabinetPartyMix = (
                        (role.category === CAT_CABINET && prevItem.role.category === CAT_PARTY) ||
                        (role.category === CAT_PARTY && prevItem.role.category === CAT_CABINET)
                    );

                    if (isSameDaySwap || (isCabinetPartyMix && absGap <= sevenDaysMs)) {
                        // 特例：同一レーンに配置
                        assignedLane = l;
                        
                        // ★視覚調整（クリッピング）
                        const newPrevHeight = msToPx(myStartMs - (prevItem.role.startDate.getTime() - blockStart.getTime()));
                        prevItem.heightPx = Math.max(1, newPrevHeight);
                        
                        break; 
                    }
                }
            }

            if (assignedLane === -1) {
                if (firstAvailableLane !== -1) {
                    assignedLane = firstAvailableLane;
                } else {
                    assignedLane = laneEndsPx.length;
                    laneEndsPx.push(0);
                }
            }
        }

        if (laneEndsPx.length <= assignedLane) {
            laneEndsPx.push(0);
        }
        
        items.push({
            role: role,
            topPx: topPx,
            heightPx: heightPx,
            lane: assignedLane,
            maxLane: 0
        });
        
        laneEndsPx[assignedLane] = topPx + heightPx;
    });

    const maxLane = Math.max(...items.map(i => i.lane));
    items.forEach(i => i.maxLane = maxLane);

    return items;
}

// --- その他ユーティリティ ---

function closeDetailsSidebar() {
    if (!detailsSidebar || !globalOverlay) return;
    detailsSidebar.classList.remove('open');
    if (!rankingSidebar.classList.contains('open')) globalOverlay.classList.remove('open');
}

function displayRoleRanking(statsMap, mode) {
    const dataArray = Array.from(statsMap.values());
    if (mode === 'appearances') {
        dataArray.sort((a, b) => b.appearances - a.appearances);
    } else {
        dataArray.sort((a, b) => b.days - a.days);
    }
    
    let html = '<ol class="ranking-list">';
    dataArray.slice(0, 50).forEach(person => { 
        let value = "";
        if (mode === 'appearances') {
             value = `${person.appearances} 回`;
        } else {
             value = `${person.days} 日`;
        }
        html += `<li class="ranking-item"><span class="ranking-name-link" data-person-id="${person.id}" data-person-name="${person.name}">${person.name}</span><span class="ranking-value">${value}</span></li>`;
    });
    html += '</ol>';
    
    rankingSidebarContent.innerHTML = html;
    rankingSidebarContent.querySelectorAll('.ranking-name-link').forEach(link => {
        link.addEventListener('click', (e) => {
            closeRankingSidebar(); 
            openSidebar(e.target.dataset.personId, e.target.dataset.personName);
        });
    });
}

function openRoleRankingSidebar(post) {
    if (!rankingSidebar || !rankingSidebarTitle || !rankingSidebarContent) return;
    let title = `${post.displayName} 在任ランキング`;
    if (title.length > 20) title = title.substring(0, 20) + '… ランキング';
    rankingSidebarTitle.textContent = title;
    currentRankingScope = 'role';
    currentRolePost = post; 
    const targetBaseNames = post.allBaseNames;
    const filteredData = initialProcessedData.filter(d => {
        const isTemporary = d.PostName.includes('臨時代理') || d.PostName.includes('事務取扱');
        if (isTemporary) return false;
        const basePost = standardizePostName(d.PostName);
        return targetBaseNames.has(basePost);
    });
    currentRoleStats = calculateStats(filteredData, true); 
    currentRankingMode = 'days';
    
    if (btnRankModeCareer) btnRankModeCareer.style.display = 'none';
    
    displayRoleRanking(currentRoleStats, 'days');
    updateRankingButtons();
    rankingScopeToggle.classList.add('hidden');
    rankingSidebar.classList.add('open');
    globalOverlay.classList.add('open');
}

function openGlobalRankingSidebar() {
    if (!rankingSidebar || !rankingSidebarTitle || !rankingSidebarContent) return;
    currentRankingScope = 'global';
    currentRolePost = null; 
    rankingSidebarTitle.textContent = '総合ランキング';
    rankingScopeToggle.classList.remove('hidden');
    
    if (btnRankModeCareer) btnRankModeCareer.style.display = 'inline-block';

    if (currentRankingMode !== 'appearances' && currentRankingMode !== 'career') {
        currentRankingMode = 'days';
    }
    updateRankingButtons();
    displayRanking();
    rankingSidebar.classList.add('open');
    globalOverlay.classList.add('open');
}

function updateRankingButtons() {
    btnRankModeDays.classList.remove('active');
    btnRankModeAppearance.classList.remove('active');
    if (btnRankModeCareer) btnRankModeCareer.classList.remove('active');

    if (currentRankingMode === 'days') btnRankModeDays.classList.add('active');
    else if (currentRankingMode === 'appearances') btnRankModeAppearance.classList.add('active');
    else if (currentRankingMode === 'career' && btnRankModeCareer) btnRankModeCareer.classList.add('active');
}

function closeRankingSidebar() {
    if (!rankingSidebar || !globalOverlay) return;
    rankingSidebar.classList.remove('open');
    if (!detailsSidebar.classList.contains('open')) globalOverlay.classList.remove('open');
}

function displayRanking() {
    let dataMap;
    if (currentRankingScope === 'global') {
        const filteredData = initialProcessedData.filter(d => {
            if (d.PostName.includes('臨時代理') || d.PostName.includes('事務取扱')) return false;
            const cat = getPostCategory(d);
            
            // Use activeScopes (controlled by ranking sidebar buttons)
            if (!activeScopes.has(cat)) return false;
            
            // If Party category is active in ranking, check the main party filter
            if (cat === CAT_PARTY && activePartyFilter !== 'all') {
                 if (d.CabinetName !== activePartyFilter) return false;
            }
            
            return true;
        });
        dataMap = calculateStats(filteredData, false); 
    } else {
        dataMap = currentRoleStats;
    }
    
    if (currentRankingMode === 'career') {
        const dataArray = Array.from(dataMap.values());
        dataArray.sort((a, b) => b.careerDuration - a.careerDuration);
        let html = '<ol class="ranking-list">';
        dataArray.slice(0, 50).forEach(person => { 
             const years = Math.floor(person.careerDuration / 365);
             const value = `${years} 年`;
             html += `<li class="ranking-item"><span class="ranking-name-link" data-person-id="${person.id}" data-person-name="${person.name}">${person.name}</span><span class="ranking-value">${value}</span></li>`;
        });
        html += '</ol>';
        rankingSidebarContent.innerHTML = html;
        rankingSidebarContent.querySelectorAll('.ranking-name-link').forEach(link => {
            link.addEventListener('click', (e) => {
                closeRankingSidebar(); 
                openSidebar(e.target.dataset.personId, e.target.dataset.personName);
            });
        });
    } else {
        displayRoleRanking(dataMap, currentRankingMode);
    }
}

const calculateStats = (data, isRoleSpecific) => {
    const stats = new Map();
    const personMap = new Map();

    data.forEach(d => {
        let key = d.PersonName;
        if (["吉田茂", "山村新治郎", "鈴木俊一"].includes(d.PersonName)) {
            key = `${d.PersonName}_${d.PersonID}`;
        }
        
        if (!personMap.has(key)) {
            personMap.set(key, {
                id: d.PersonID,
                name: d.PersonName,
                periods: [],
                apptDates: new Set(),
                minDate: new Date(d.AppointmentDate),
                maxDate: new Date(d.ResignationDate)
            });
        }
        const p = personMap.get(key);
        p.periods.push({ start: new Date(d.AppointmentDate).getTime(), end: new Date(d.ResignationDate).getTime() });
        p.apptDates.add(d.AppointmentDate.getTime()); 
        
        if (d.AppointmentDate < p.minDate) p.minDate = new Date(d.AppointmentDate);
        if (d.ResignationDate > p.maxDate) p.maxDate = new Date(d.ResignationDate);
    });

    personMap.forEach((value, key) => {
        value.periods.sort((a, b) => a.start - b.start);
        const mergedPeriods = [];
        if (value.periods.length > 0) {
            let currentPeriod = value.periods[0];
            for (let i = 1; i < value.periods.length; i++) {
                const nextPeriod = value.periods[i];
                if (nextPeriod.start < currentPeriod.end) {
                    if (nextPeriod.end > currentPeriod.end) {
                        currentPeriod.end = nextPeriod.end;
                    }
                } else {
                    mergedPeriods.push(currentPeriod);
                    currentPeriod = nextPeriod;
                }
            }
            mergedPeriods.push(currentPeriod);
        }

        let totalDays = 0;
        mergedPeriods.forEach(p => {
            totalDays += Math.floor((p.end - p.start) / (1000 * 60 * 60 * 24));
        });

        const careerDiff = Math.abs(value.maxDate - value.minDate);
        const careerDays = Math.ceil(careerDiff / (1000 * 60 * 60 * 24));

        stats.set(key, {
            id: value.id,
            name: value.name,
            days: totalDays,
            appearances: value.apptDates.size,
            careerDuration: careerDays
        });
    });

    return stats;
};

// --- 政党フィルター用データ生成関数 ---
const populatePartySelect = () => {
    const parties = new Set();
    ministerData.forEach(d => {
        const cat = getPostCategory(d);
        if (cat === CAT_PARTY && d.CabinetName) {
             parties.add(d.CabinetName);
        }
    });
    
    // ドロップダウンを初期化
    partySelect.innerHTML = '<option value="all">全政党</option>';
    Array.from(parties).sort().forEach(party => {
        const opt = document.createElement('option');
        opt.value = party;
        opt.textContent = party;
        partySelect.appendChild(opt);
    });
};

const updateChartOnScroll = () => {
    const scrollLeft = chartScrollArea.scrollLeft;
    const newDaysFromStartLeft = scrollLeft / SCALING_FACTOR;
    const newLeftEdgeDate = new Date(minDate.getTime() + newDaysFromStartLeft * (1000 * 60 * 60 * 24)); 
    const viewportWidth = chartScrollArea.clientWidth;
    const newRightPosition = scrollLeft + viewportWidth;
    const newDaysFromStartRight = newRightPosition / SCALING_FACTOR;
    const newRightEdgeDate = new Date(minDate.getTime() + newDaysFromStartRight * (1000 * 60 * 60 * 24)); 

    let newLeftEdgeMap = currentLeftEdgeMap;
    for (let i = 0; i < sequenceChangePoints.length; i++) {
        if (newLeftEdgeDate >= sequenceChangePoints[i].startDate) { 
            newLeftEdgeMap = sequenceChangePoints[i].map;
        }
    }

    const newSortedPostsForYAxis = updateYAxisLabels(newLeftEdgeMap, newLeftEdgeDate, newRightEdgeDate);
    let yAxisChanged = false;
    if (newSortedPostsForYAxis.length !== sortedPostsForYAxis.length) {
        yAxisChanged = true;
    } else {
        for(let i=0; i < newSortedPostsForYAxis.length; i++) {
            if (newSortedPostsForYAxis[i] !== sortedPostsForYAxis[i]) {
                yAxisChanged = true;
                break;
            }
        }
    }
    
    if (newLeftEdgeMap !== currentLeftEdgeMap || yAxisChanged) {
        currentLeftEdgeMap = newLeftEdgeMap; 
        leftEdgeDate = newLeftEdgeDate;
        rightEdgeDate = newRightEdgeDate;
        sortedPostsForYAxis = newSortedPostsForYAxis;
        renderChart(sortedPostsForYAxis); 
    }
};

const renderTimeline = (minDate, totalDays) => {
    xAxisTimeline.innerHTML = '';
    
    calculatedWidth = totalDays * SCALING_FACTOR + 500;
    xAxisTimeline.style.width = `${calculatedWidth}px`;
    chartPlotArea.style.width = `${calculatedWidth}px`;

    let currentDate = new Date(minDate);
    currentDate.setDate(1); 
    const endTimelineDate = new Date(maxDate); 

    while (currentDate < endTimelineDate) {
        const dayCount = Math.floor((currentDate - minDate) / (1000 * 60 * 60 * 24));
        const leftPosition = dayCount * SCALING_FACTOR;
        const isYearStart = currentDate.getMonth() === 0;
        const isQuarterStart = currentDate.getMonth() % 3 === 0;
        let markType = 'minor';
        let labelText = '';

        if (isYearStart) {
            markType = 'major';
            labelText = currentDate.getFullYear() + '年';
        } else if (isQuarterStart) {
            markType = 'medium';
            if (SCALING_FACTOR >= 0.4) labelText = (currentDate.getMonth() + 1) + '月';
        }
        
        const dateMark = document.createElement('div');
        dateMark.className = `x-axis-mark ${markType}`;
        
        if (labelText) {
            const labelDiv = document.createElement('span');
            labelDiv.textContent = labelText;
            dateMark.appendChild(labelDiv);
        }

        dateMark.style.cssText = `left: ${leftPosition}px;`;
        xAxisTimeline.appendChild(dateMark);
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
};

const renderChart = (sortedPostsForYAxis) => {
    chartPlotArea.innerHTML = ''; 
    const activeRowCount = sortedPostsForYAxis.length;
    const chartHeight = activeRowCount * ROW_HEIGHT;
    chartPlotArea.style.height = `${chartHeight}px`;

    sortedPostsForYAxis.forEach((uniqueName, index) => {
        if (uniqueName.startsWith(SPACER_ID_PREFIX)) {
            const yPosition = index * ROW_HEIGHT;
            if (uniqueName.endsWith('_GAP')) {
                const topBorder = document.createElement('div');
                topBorder.className = 'chart-spacer-border';
                topBorder.style.cssText = `position: absolute; top: ${yPosition}px; left: 0; width: ${calculatedWidth}px; height: 1px; background-color: #666; z-index: 1;`;
                chartPlotArea.appendChild(topBorder);
            } else if (uniqueName.endsWith('_TITLE')) {
                const bottomBorder = document.createElement('div');
                bottomBorder.className = 'chart-spacer-border';
                bottomBorder.style.cssText = `position: absolute; top: ${yPosition + ROW_HEIGHT - 1}px; left: 0; width: ${calculatedWidth}px; height: 1px; background-color: #666; z-index: 1;`;
                chartPlotArea.appendChild(bottomBorder);
            }
        }
    });
    
    processedData.forEach(d => {
        const currentPostName = d.StandardPostName; 
        const dynamicIndex = sortedPostsForYAxis.findIndex(post => post === currentPostName);
        if (dynamicIndex === -1) return; 

        // --- フィルターロジック追加 ---
        const cat = getPostCategory(d);
        if (!activeCategoryFilters.has(cat)) return; // 複数選択対応
        if (activeCategoryFilters.has(CAT_PARTY) && cat === CAT_PARTY && activePartyFilter !== 'all') {
             if (d.CabinetName !== activePartyFilter) return;
        }
        // ------------------------------

        const yPosition = dynamicIndex * ROW_HEIGHT;
        const barHeight = ROW_HEIGHT - 10; 
        const barTop = yPosition + 5;      
        const tenureMs = d.ResignationDate - d.AppointmentDate;
        const tenureDays = tenureMs / (1000 * 60 * 60 * 24);
        const startDiffDays = (d.AppointmentDate - minDate) / (1000 * 60 * 60 * 24);

        const barDiv = document.createElement('div');
        barDiv.title = ''; 
        const textContent = d.PersonName;
        const barWidth = Math.max(2, tenureDays * SCALING_FACTOR); 
        const isPrimeMinister = primeMinisters.has(d.PersonName); // 【修正】名前で判定
        let barStyle = '';
        let barClass = 'chart-bar';

        const verticalThreshold = 30; 
        const tinyHorizontalThreshold = 70; 
        
        if (d.isIncumbent) {
            barClass += ' incumbent';
            barDiv.textContent = textContent; 
            barClass += ' force-full-name';   
        } else {
            if (barWidth <= verticalThreshold) { barClass += ' vertical-text-lastname'; barDiv.textContent = getLastName(textContent); } 
            else if (barWidth <= tinyHorizontalThreshold) { barClass += ' font-tiny'; barDiv.textContent = textContent; } 
            else { barDiv.textContent = textContent; }
        }
        
        if (isPrimeMinister) {
            const hue = pmHueMap.get(d.PersonName); // 【修正】名前で色を取得
            if (d.isIncumbent) {
                barStyle = `background: linear-gradient(to right, hsl(${hue}, 70%, 50%) 40%, hsla(${hue}, 70%, 50%, 0) 100%); color: white;`;
                barClass += ' highlight-pm';
            } else {
                barStyle = `background-color: hsl(${hue}, 70%, 50%); color: white;`;
            }
        } else { 
            if (!d.isIncumbent) {
                barClass += ' non-pm'; 
                barStyle = `background-color: white; border: 1px solid #4682b4; color: #000;`; 
            } else {
                barClass += ' non-pm';
            }
        }
        if (d.isDeputyPM) barClass += ' deputy-pm-bar';

        barDiv.className = barClass; 
        barDiv.style.cssText += `left: ${startDiffDays * SCALING_FACTOR}px; top: ${barTop}px; width: ${barWidth}px; height: ${barHeight}px; ${barStyle}`;
        
        const nameText = d.PersonName;
        const periodText = d.isIncumbent 
            ? `${d.AppointmentDate.toLocaleDateString('ja-JP')} ~ 現職`
            : `${d.AppointmentDate.toLocaleDateString('ja-JP')} - ${d.ResignationDate.toLocaleDateString('ja-JP')}`;
        
        let tooltipPostHTML = '';
        let postTermText = '';
        const isCountablePost = !d.PostName.startsWith('内閣府特命担当大臣') && !d.PostName.startsWith('国務大臣') && !d.PostName.startsWith('班列');
        if (isCountablePost && d.PostTerm) {
             postTermText = (d.PostTerm === 1 || d.PostTerm === "1") ? '初代 ' : `第${d.PostTerm}代 `;
        }
        let postNameText = d.PostName;
        if (PARTY_ROLE_BASE_NAMES_SET.has(d.BasePostName) && !postNameText.startsWith('自由民主党')) {
             postNameText = `自由民主党 ${postNameText}`;
        }
        tooltipPostHTML = `<div class="tooltip-post">${postTermText}${postNameText}</div>`;

        let tooltipKenninHTML = '';
        if (d.kenninInfo && d.kenninInfo.length > 0) {
            d.kenninInfo.forEach(post => {
                tooltipKenninHTML += `兼 ${post}<br>`;
            });
        }
        
        const tooltipHTML = `
            <div class="tooltip-name">${nameText}</div>
            ${d.isDeputyPM ? '<div class="tooltip-deputy">副総理</div>' : ''}
            ${tooltipPostHTML}
            ${tooltipKenninHTML ? `<div class="tooltip-kennin">${tooltipKenninHTML}</div>` : ''} 
            <div class="tooltip-period">${periodText}</div>
        `;
        
        barDiv.addEventListener('mouseover', () => { customTooltip.innerHTML = tooltipHTML; customTooltip.style.display = 'block'; });
        barDiv.addEventListener('mouseout', () => { customTooltip.style.display = 'none'; });
        barDiv.addEventListener('mousemove', (event) => { customTooltip.style.left = `${event.pageX + 10}px`; customTooltip.style.top = `${event.pageY + 10}px`; });
        barDiv.addEventListener('click', () => { openSidebar(d.PersonID, d.PersonName); });
        
        chartPlotArea.appendChild(barDiv);
    });
};

const getLastName = (fullName) => {
    if (fullName === "犬養毅") return "犬養";
    if (fullName === "西園寺公望") return "西園寺";
    if (fullName === "東久邇宮稔彦王") return "東久邇宮";
    if (fullName.length <= 3) return fullName.substring(0, 1); 
    return fullName.substring(0, 2); 
};

document.addEventListener('DOMContentLoaded', () => {
    customTooltip = document.createElement('div');
    customTooltip.id = 'custom-tooltip';
    document.body.appendChild(customTooltip);

    detailsSidebar = document.getElementById('details-sidebar');
    sidebarTitle = document.getElementById('sidebar-title');
    sidebarContent = document.getElementById('sidebar-content');
    closeDetailsSidebarBtn = document.getElementById('close-details-sidebar-btn');
    
    rankingSidebar = document.getElementById('ranking-sidebar');
    rankingSidebarTitle = document.getElementById('ranking-sidebar-title');
    rankingSidebarContent = document.getElementById('ranking-sidebar-content');
    closeRankingSidebarBtn = document.getElementById('close-ranking-sidebar-btn');
    
    btnRankModeDays = document.getElementById('btn-rank-mode-days');
    btnRankModeAppearance = document.getElementById('btn-rank-mode-appearance');
    
    let careerBtn = document.getElementById('btn-rank-mode-career');
    if (!careerBtn) {
        const container = document.querySelector('.ranking-mode-toggle');
        if (container) {
            careerBtn = document.createElement('button');
            careerBtn.id = 'btn-rank-mode-career';
            careerBtn.className = 'toggle-btn-rank';
            careerBtn.textContent = '活動期間';
            container.appendChild(careerBtn);
        }
    }
    btnRankModeCareer = careerBtn;

    rankingScopeToggle = document.getElementById('ranking-scope-toggle');
    const scopeButtons = document.querySelectorAll('.scope-btn');
    globalOverlay = document.getElementById('global-overlay');
    btnGlobalRanking = document.getElementById('btn-global-ranking');
    
    if (closeDetailsSidebarBtn) closeDetailsSidebarBtn.addEventListener('click', closeDetailsSidebar);
    if (closeRankingSidebarBtn) closeRankingSidebarBtn.addEventListener('click', closeRankingSidebar);
    if (globalOverlay) {
        globalOverlay.addEventListener('click', () => {
            closeDetailsSidebar();
            closeRankingSidebar();
        });
    }

    // --- フィルターボタンのイベントリスナー ---
    mainFilterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            
            // トグル動作
            if (activeCategoryFilters.has(filter)) {
                activeCategoryFilters.delete(filter);
                e.target.classList.remove('active');
            } else {
                activeCategoryFilters.add(filter);
                e.target.classList.add('active');
            }
            
            // 政党選択ドロップダウンの表示制御
            if (activeCategoryFilters.has(CAT_PARTY)) {
                partySelectContainer.style.display = 'block';
                populatePartySelect();
            } else {
                partySelectContainer.style.display = 'none';
                activePartyFilter = 'all'; // 政党フィルターOFF時は選択状態リセット
            }
            
            // グラフ再描画
            updateChartOnScroll();
        });
    });

    // 政党選択ドロップダウンのイベントリスナー
    partySelect.addEventListener('change', (e) => {
        activePartyFilter = e.target.value;
        updateChartOnScroll();
    });

    document.getElementById('btn-zoom-in').addEventListener('click', () => { 
        currentZoomIndex = Math.min(currentZoomIndex + 1, ZOOM_LEVELS.length - 1); 
        updateZoom(); 
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => { 
        currentZoomIndex = Math.max(currentZoomIndex - 1, 0); 
        updateZoom(); 
    });
    document.getElementById('btn-zoom-reset').addEventListener('click', () => { 
        currentZoomIndex = 2; 
        updateZoom(); 
    });

    const updateZoom = () => {
        SCALING_FACTOR = ZOOM_LEVELS[currentZoomIndex];
        renderTimeline(minDate, totalDays);
        updateChartOnScroll();
    };

    document.getElementById('search-input').addEventListener('input', (e) => {
        const val = e.target.value;
        const res = document.getElementById('search-results');
        res.innerHTML = '';
        if (!val) { res.style.display = 'none'; return; }
        
        const hits = Array.from(new Set(ministerData.map(d => d.PersonName))).filter(n => n.includes(val));
        
        if (hits.length) {
            res.style.display = 'block';
            hits.forEach(n => {
                const d = document.createElement('div');
                d.className = 'search-result-item';
                d.textContent = n;
                d.onclick = () => {
                    const p = ministerData.find(x => x.PersonName === n);
                    if(p) openSidebar(p.PersonID, p.PersonName);
                    res.style.display = 'none';
                    e.target.value = ''; 
                };
                res.appendChild(d);
            });
        } else {
            res.style.display = 'none';
        }
    });

    if (btnGlobalRanking) {
        btnGlobalRanking.addEventListener('click', () => {
            currentRankingMode = 'days';
            activeScopes.clear();
            activeScopes.add(CAT_CABINET);
            activeScopes.add(CAT_PARTY);
            scopeButtons.forEach(btn => {
                const cat = btn.dataset.category;
                if (activeScopes.has(cat)) btn.classList.add('active');
                else btn.classList.remove('active');
            });
            openGlobalRankingSidebar();
        });
    }

    if (btnRankModeDays) {
        btnRankModeDays.addEventListener('click', () => {
            currentRankingMode = 'days';
            updateRankingButtons();
            displayRanking(); 
        });
    }
    if (btnRankModeAppearance) {
        btnRankModeAppearance.addEventListener('click', () => {
            currentRankingMode = 'appearances';
            updateRankingButtons();
            displayRanking(); 
        });
    }
    if (btnRankModeCareer) {
        btnRankModeCareer.addEventListener('click', () => {
            currentRankingMode = 'career';
            updateRankingButtons();
            displayRanking();
        });
    }

    scopeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            if (activeScopes.has(category)) {
                activeScopes.delete(category);
                e.target.classList.remove('active');
            } else {
                activeScopes.add(category);
                e.target.classList.add('active');
            }
            if (currentRankingScope === 'global') displayRanking();
            updateChartOnScroll();
        });
    });

    if (hasData) {
        renderTimeline(minDate, totalDays);
        const initialScrollLeft = chartScrollArea.scrollLeft; 
        const initialViewportWidth = chartScrollArea.clientWidth; 
        leftEdgeDate = minDate; 
        const initialDaysRight = (initialScrollLeft + initialViewportWidth) / SCALING_FACTOR;
        rightEdgeDate = new Date(minDate.getTime() + initialDaysRight * (1000 * 60 * 60 * 24)); 
        
        if (rightEdgeDate > maxDate || initialViewportWidth === 0) {
             const fallbackDays = (1000 / SCALING_FACTOR);
             rightEdgeDate = new Date(minDate.getTime() + fallbackDays * (1000 * 60 * 60 * 24));
             if (rightEdgeDate > maxDate) rightEdgeDate = new Date(maxDate);
        }

        for (let i = 0; i < sequenceChangePoints.length; i++) {
            if (leftEdgeDate >= sequenceChangePoints[i].startDate) { 
                currentLeftEdgeMap = sequenceChangePoints[i].map;
            }
        }
        
        const finalSortedPosts = updateYAxisLabels(currentLeftEdgeMap, leftEdgeDate, rightEdgeDate);
        sortedPostsForYAxis = finalSortedPosts; 
        renderChart(finalSortedPosts);

        if (chartScrollArea) {
            chartScrollArea.addEventListener('scroll', () => {
                updateChartOnScroll(); 
                yAxisLabelsContainer.style.transform = `translateY(-${chartScrollArea.scrollTop}px)`;
            });
        }
        const yAxisFixed = document.querySelector('.y-axis-fixed');
        if (yAxisFixed) {
             yAxisFixed.addEventListener('wheel', (event) => {
                event.preventDefault();
                chartScrollArea.scrollTop += event.deltaY;
            });
        }
    } else {
        console.error("No valid minister data found.");
    }
});

window.openSidebar = openSidebar;