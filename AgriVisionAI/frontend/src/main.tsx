import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

type User = { id: number; full_name: string; email: string; preferred_language: string };

i18n.use(initReactI18next).init({
  lng: localStorage.getItem("lang") || "en",
  fallbackLng: "en",
  resources: {
    en: { translation: {
      tag: "Smart Insights. Healthy Crops. Better Profits.",
      crop: "Crop",
      horizon: "Forecast days",
      go: "Get forecast",
      disease: "Disease detection",
      unavail: "Disease model unavailable",
      analyze_image: "Analyze crop image",
      choose_image: "Please choose an image first.",
      possible_disease: "Possible disease",
      healthy_crop: "Healthy crop",
      confidence: "Confidence",
      observed: "Observed",
      forecast: "Forecast",
      latest_recorded: "Latest recorded",
      forecast_for: "Forecast for",
      increasing: "Increasing",
      decreasing: "Decreasing",
      uncertain: "Uncertain",
      holdout_mae: "Held-out test MAE",
      baseline_mae: "persistence baseline MAE",
      synthetic_data: "synthetic demo data",
      uncertainty_text: "No prediction interval implemented; treat as a rough estimate.",
      disease_healthy_message: "Demo check suggests the crop looks healthy in this prototype view.",
      disease_advice_healthy: "Continue to monitor leaf colour and moisture, and check with a local agronomist if symptoms develop.",
      disease_advice_detected: "Inspect the affected leaves, reduce moisture stress, and consult a local agricultural officer for confirmation.",
      disease_disclaimer: "Prototype heuristic for demo use only, not an agronomic diagnosis.",
      disease_possible_message: "Demo check indicates possible {{disease}} for {{crop}}.",
      location: "Live location",
      share_location: "Share live location",
      stop_location: "Stop sharing location",
      location_waiting: "Waiting for location permission…",
      location_denied: "Location permission was denied. Allow it in Chrome site settings to share your location.",
      location_unavailable: "Live location is unavailable in this browser or context.",
      latitude: "Latitude",
      longitude: "Longitude",
      accuracy: "Accuracy",
      meters: "m",
      sample_prices: "Sample market prices · synthetic demo data",
      your_area: "Your area",
      nearby_markets: "Nearby markets",
      no_nearby_markets: "No mapped markets found within {{radius}} km.",
      nearby_loading: "Finding nearby markets…",
      location_lookup_failed: "Could not look up this location. Check your connection and try again.",
      location_privacy: "Your coordinates are sent to OpenStreetMap services to identify this area and nearby markets.",
      distance: "km away",
      market_source: "Market locations by OpenStreetMap",
      diagnosis: {
        "Early blight": "Early blight", "Leaf spot": "Leaf spot", Healthy: "Healthy",
        Anthracnose: "Anthracnose", "Leaf curl": "Leaf curl", "Leaf blight": "Leaf blight",
        Rust: "Rust", "Downy mildew": "Downy mildew", "Purple blotch": "Purple blotch",
        "Brown spot": "Brown spot", "Leaf blotch": "Leaf blotch"
      },
      note: "Forecasts are estimates, not guarantees.",
      login: "Login",
      register: "Register",
      email: "Email",
      password: "Password",
      full_name: "Full name",
      confirm_password: "Confirm password",
      accept_terms: "I accept the terms",
      welcome: "Welcome back",
      no_account: "Need an account? Register",
      have_account: "Already have an account? Login",
      logout: "Logout",
      register_success: "Registration successful. Please log in.",
      invalid_user: "Please sign in to continue.",
      auth_error: "Unable to authenticate. Please check your details.",
      submit: "Submit"
    } },
    hi: { translation: {
      tag: "स्मार्ट जानकारी। स्वस्थ फसल। बेहतर लाभ।",
      crop: "फसल",
      horizon: "पूर्वानुमान दिन",
      go: "पूर्वानुमान देखें",
      disease: "रोग पहचान",
      unavail: "रोग मॉडल उपलब्ध नहीं",
      analyze_image: "फसल की तस्वीर का विश्लेषण करें",
      choose_image: "पहले एक तस्वीर चुनें।",
      possible_disease: "संभावित रोग",
      healthy_crop: "स्वस्थ फसल",
      confidence: "विश्वास स्तर",
      observed: "वास्तविक मूल्य",
      forecast: "पूर्वानुमान",
      latest_recorded: "नवीनतम दर्ज मूल्य",
      forecast_for: "इस तारीख का पूर्वानुमान",
      increasing: "बढ़ रहा है",
      decreasing: "घट रहा है",
      uncertain: "अनिश्चित",
      holdout_mae: "परीक्षण MAE",
      baseline_mae: "पिछले मूल्य आधार MAE",
      synthetic_data: "कृत्रिम डेमो डेटा",
      uncertainty_text: "पूर्वानुमान अंतराल उपलब्ध नहीं है; इसे केवल एक अनुमान मानें।",
      disease_healthy_message: "डेमो जांच के अनुसार इस प्रोटोटाइप में फसल स्वस्थ दिखती है।",
      disease_advice_healthy: "पत्तियों के रंग और नमी पर नज़र रखें। लक्षण दिखें तो स्थानीय कृषि विशेषज्ञ से संपर्क करें।",
      disease_advice_detected: "प्रभावित पत्तियों की जांच करें, नमी का तनाव कम करें और पुष्टि के लिए स्थानीय कृषि अधिकारी से संपर्क करें।",
      disease_disclaimer: "केवल डेमो के लिए प्रोटोटाइप अनुमान, कृषि निदान नहीं।",
      disease_possible_message: "डेमो जांच में {{crop}} में {{disease}} की संभावना दिखती है।",
      location: "लाइव स्थान",
      share_location: "लाइव स्थान साझा करें",
      stop_location: "स्थान साझा करना बंद करें",
      location_waiting: "स्थान अनुमति की प्रतीक्षा है…",
      location_denied: "स्थान की अनुमति नहीं मिली। साझा करने के लिए Chrome की साइट सेटिंग में अनुमति दें।",
      location_unavailable: "इस ब्राउज़र या संदर्भ में लाइव स्थान उपलब्ध नहीं है।",
      latitude: "अक्षांश",
      longitude: "देशांतर",
      accuracy: "सटीकता",
      meters: "मी",
      sample_prices: "नमूना बाजार मूल्य · कृत्रिम डेमो डेटा",
      your_area: "आपका क्षेत्र",
      nearby_markets: "आस-पास के बाजार",
      no_nearby_markets: "{{radius}} किमी के भीतर कोई मानचित्रित बाजार नहीं मिला।",
      nearby_loading: "आस-पास के बाजार खोजे जा रहे हैं…",
      location_lookup_failed: "स्थान नहीं खोजा जा सका। इंटरनेट जांचें और फिर कोशिश करें।",
      location_privacy: "क्षेत्र और आस-पास के बाजार पहचानने के लिए आपके निर्देशांक OpenStreetMap सेवाओं को भेजे जाते हैं।",
      distance: "किमी दूर",
      market_source: "बाजार स्थान: OpenStreetMap",
      diagnosis: {
        "Early blight": "अगेती झुलसा", "Leaf spot": "पत्ती धब्बा", Healthy: "स्वस्थ",
        Anthracnose: "एन्थ्रेक्नोज", "Leaf curl": "पत्ती मुड़ना", "Leaf blight": "पत्ती झुलसा",
        Rust: "रतुआ", "Downy mildew": "मृदुरोमिल आसिता", "Purple blotch": "बैंगनी धब्बा",
        "Brown spot": "भूरा धब्बा", "Leaf blotch": "पत्ती धब्बा"
      },
      note: "पूर्वानुमान अनुमान हैं, गारंटी नहीं।",
      login: "लॉगिन",
      register: "रजिस्टर",
      email: "ईमेल",
      password: "पासवर्ड",
      full_name: "पूरा नाम",
      confirm_password: "पासवर्ड दोबारा",
      accept_terms: "मैं नियम स्वीकार करता हूँ",
      welcome: "वापसी पर स्वागत है",
      no_account: "खाता नहीं है? रजिस्टर करें",
      have_account: "पहले से खाता है? लॉगिन करें",
      logout: "लॉगआउट",
      register_success: "रजिस्ट्रेशन सफल हुआ। कृपया लॉगिन करें।",
      invalid_user: "जारी रखने के लिए लॉगिन करें।",
      auth_error: "प्रमाणीकरण में समस्या हुई। विवरण देखें।",
      submit: "जमा करें"
    } },
    te: { translation: {
      tag: "స్మార్ట్ అంతర్దృష్టి. ఆరోగ్యకరమైన పంటలు. మెరుగైన లాభాలు.",
      crop: "పంట",
      horizon: "అంచనా రోజులు",
      go: "అంచనా చూడండి",
      disease: "వ్యాధి గుర్తింపు",
      unavail: "వ్యాధి మోడల్ అందుబాటులో లేదు",
      analyze_image: "పంట చిత్రాన్ని విశ్లేషించండి",
      choose_image: "ముందుగా చిత్రాన్ని ఎంచుకోండి.",
      possible_disease: "వ్యాధి ఉండే అవకాశం",
      healthy_crop: "ఆరోగ్యకరమైన పంట",
      confidence: "నమ్మక స్థాయి",
      observed: "నమోదైన ధర",
      forecast: "ధర అంచనా",
      latest_recorded: "చివరిగా నమోదైన ధర",
      forecast_for: "ఈ తేదీకి అంచనా",
      increasing: "పెరుగుతోంది",
      decreasing: "తగ్గుతోంది",
      uncertain: "అనిశ్చితం",
      holdout_mae: "పరీక్ష MAE",
      baseline_mae: "గత ధర ఆధారిత MAE",
      synthetic_data: "సింథటిక్ డెమో డేటా",
      uncertainty_text: "అంచనా పరిధి అందుబాటులో లేదు; దీన్ని సుమారు అంచనాగా మాత్రమే పరిగణించండి.",
      disease_healthy_message: "డెమో తనిఖీలో ఈ ప్రోటోటైప్‌లో పంట ఆరోగ్యంగా కనిపిస్తోంది.",
      disease_advice_healthy: "ఆకు రంగు, తేమను గమనించండి. లక్షణాలు కనిపిస్తే స్థానిక వ్యవసాయ నిపుణుడిని సంప్రదించండి.",
      disease_advice_detected: "ప్రభావిత ఆకులను పరిశీలించి, తేమ ఒత్తిడిని తగ్గించండి; నిర్ధారణ కోసం స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి.",
      disease_disclaimer: "డెమో కోసం మాత్రమే ప్రోటోటైప్ అంచనా; వ్యవసాయ నిర్ధారణ కాదు.",
      disease_possible_message: "డెమో తనిఖీలో {{crop}} పంటకు {{disease}} ఉండే అవకాశం కనిపిస్తోంది.",
      location: "ప్రత్యక్ష స్థానం",
      share_location: "ప్రత్యక్ష స్థానాన్ని పంచుకోండి",
      stop_location: "స్థానాన్ని పంచుకోవడం ఆపండి",
      location_waiting: "స్థాన అనుమతి కోసం వేచి ఉంది…",
      location_denied: "స్థాన అనుమతి నిరాకరించబడింది. Chrome సైట్ సెట్టింగ్స్‌లో అనుమతించండి.",
      location_unavailable: "ఈ బ్రౌజర్ లేదా సందర్భంలో ప్రత్యక్ష స్థానం అందుబాటులో లేదు.",
      latitude: "అక్షాంశం",
      longitude: "రేఖాంశం",
      accuracy: "ఖచ్చితత్వం",
      meters: "మీ",
      sample_prices: "నమూనా మార్కెట్ ధరలు · సింథటిక్ డెమో డేటా",
      your_area: "మీ ప్రాంతం",
      nearby_markets: "సమీప మార్కెట్లు",
      no_nearby_markets: "{{radius}} కి.మీ. పరిధిలో మ్యాప్ చేసిన మార్కెట్లు కనబడలేదు.",
      nearby_loading: "సమీప మార్కెట్లను వెతుకుతోంది…",
      location_lookup_failed: "ఈ స్థానాన్ని గుర్తించలేకపోయాం. ఇంటర్నెట్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
      location_privacy: "మీ ప్రాంతం, సమీప మార్కెట్లను గుర్తించడానికి మీ స్థాన నిర్దేశాంకాలు OpenStreetMap సేవలకు పంపబడతాయి.",
      distance: "కి.మీ. దూరంలో",
      market_source: "మార్కెట్ స్థానాలు: OpenStreetMap",
      diagnosis: {
        "Early blight": "ముందస్తు ఎండు తెగులు", "Leaf spot": "ఆకు మచ్చ", Healthy: "ఆరోగ్యకరం",
        Anthracnose: "ఆంత్రాక్నోస్", "Leaf curl": "ఆకు ముడత", "Leaf blight": "ఆకు ఎండు తెగులు",
        Rust: "తుప్పు తెగులు", "Downy mildew": "డౌనీ మిల్డ్యూ", "Purple blotch": "ఊదా మచ్చ",
        "Brown spot": "గోధుమ మచ్చ", "Leaf blotch": "ఆకు మచ్చ తెగులు"
      },
      note: "అంచనాలు కేవలం అంచనాలే, హామీలు కాదు.",
      login: "లాగిన్",
      register: "నమోదు",
      email: "ఇమెయిల్",
      password: "పాస్వర్డ్",
      full_name: "పూర్తి పేరు",
      confirm_password: "పాస్వర్డ్‌ను నిర్ధారించండి",
      accept_terms: "నేను నియమాలను అంగీకరిస్తున్నాను",
      welcome: "మళ్లీ స్వాగతం",
      no_account: "ఖాతా లేదా? నమోదు చేయండి",
      have_account: "ఖాతా ఉందా? లాగిన్ చేయండి",
      logout: "లాగ్అవుట్",
      register_success: "నమోదు విజయవంతమైంది. దయచేసి లాగిన్ చేయండి.",
      invalid_user: "కొనసాగడానికి లాగిన్ చేయండి.",
      auth_error: "ప్రామాణీకరణ చేయలేకపోయాము. వివరాలను చెక్ చేయండి.",
      submit: "సబ్మిట్"
    } }
  }
});

const apiFetch = async (path: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("agri_token");
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  const apiHost = import.meta.env.VITE_API_HOST;
  const response = await fetch(`${apiHost ? `https://${apiHost}` : ""}${path}`, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(typeof payload === "string" ? payload : payload?.detail || "Request failed");
  }
  return payload;
};

function AuthView() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("Passw0rd!");
  const [confirmPassword, setConfirmPassword] = useState("Passw0rd!");
  const [fullName, setFullName] = useState("Demo User");
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(""); setMsg("");
    try {
      if (mode === "register") {
        await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            full_name: fullName,
            email,
            password,
            confirm_password: confirmPassword,
            accept_terms: acceptTerms,
            phone: null,
            state: null,
            district: null,
            preferred_language: localStorage.getItem("lang") || "en"
          })
        });
        setMsg(t("register_success"));
        setMode("login");
        setPassword("Passw0rd!");
        setConfirmPassword("Passw0rd!");
        return;
      }

      const payload = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem("agri_token", payload.access_token);
      localStorage.setItem("agri_refresh_token", payload.refresh_token);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth_error"));
    }
  };

  return <div style={{ maxWidth: 520, margin: "40px auto", padding: 24 }}>
    <div style={{ background: "#176B3A", color: "#fff", borderRadius: 16, padding: 24, marginBottom: 20 }}>
      <h1 style={{ margin: 0 }}>AgriTech AI</h1>
      <p style={{ margin: "10px 0 0" }}>{t("tag")}</p>
      <div style={{ marginTop: 12 }}>
        <select aria-label="language" value={i18n.language} onChange={e => { i18n.changeLanguage(e.target.value); localStorage.setItem("lang", e.target.value); }} style={{ padding: 8, borderRadius: 8 }}>
          <option value="en">English</option>
          <option value="te">తెలుగు</option>
          <option value="hi">हिन्दी</option>
        </select>
      </div>
    </div>

    <form onSubmit={onSubmit} style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.12)" }}>
      <h2 style={{ marginTop: 0 }}>{mode === "login" ? t("login") : t("register")}</h2>
      {msg && <div style={{ background: "#eafaf1", color: "#14532d", padding: 10, borderRadius: 8, marginBottom: 12 }}>{msg}</div>}
      {error && <div style={{ background: "#fdecea", color: "#8a1c1c", padding: 10, borderRadius: 8, marginBottom: 12 }}>{error}</div>}

      {mode === "register" && <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>{t("full_name")}</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }} />
      </div>}

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>{t("email")}</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>{t("password")}</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }} />
      </div>

      {mode === "register" && <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>{t("confirm_password")}</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }} />
      </div>}

      {mode === "register" && <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} />
        <span>{t("accept_terms")}</span>
      </label>}

      <button type="submit" style={{ width: "100%", background: "#176B3A", color: "#fff", border: 0, borderRadius: 8, padding: "12px 16px", fontWeight: 600 }}>{t("submit")}</button>
      <div style={{ marginTop: 14, textAlign: "center" }}>
        <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ background: "transparent", border: "none", color: "#176B3A", cursor: "pointer", fontWeight: 600 }}>
          {mode === "login" ? t("no_account") : t("have_account")}
        </button>
      </div>
    </form>
  </div>;
}

function DashboardApp() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [crops, setCrops] = useState<string[]>([]); const [crop, setCrop] = useState(""); const [h, setH] = useState(7);
  const [hist, setHist] = useState<any>(null); const [fc, setFc] = useState<any>(null); const [err, setErr] = useState("");
  const [diseaseFile, setDiseaseFile] = useState<File | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<any>(null);
  const [diseaseErr, setDiseaseErr] = useState("");
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationErr, setLocationErr] = useState("");
  const [watchLocation, setWatchLocation] = useState(false);
  const [nearby, setNearby] = useState<any>(null);
  const lastNearbyLookup = useRef(0);

  useEffect(() => {
    if (!watchLocation || !user) return;
    if (!navigator.geolocation) {
      setLocationErr("location_unavailable");
      setWatchLocation(false);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      position => {
        setLocation(position);
        setLocationErr("");
        if (Date.now() - lastNearbyLookup.current < 60000) return;
        lastNearbyLookup.current = Date.now();
        const { latitude, longitude } = position.coords;
        void apiFetch(`/api/location/nearby?latitude=${latitude}&longitude=${longitude}&radius_km=20`)
          .then(setNearby)
          .catch(() => setLocationErr("location_lookup_failed"));
      },
      error => {
        setLocationErr(error.code === error.PERMISSION_DENIED ? "location_denied" : "location_unavailable");
        setWatchLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [watchLocation, t]);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("agri_token");
      if (!token) {
        setUser(null);
        return;
      }
      try {
        const currentUser = await apiFetch("/api/auth/me");
        setUser(currentUser);
      } catch {
        localStorage.removeItem("agri_token");
        localStorage.removeItem("agri_refresh_token");
        setUser(null);
      }
    };
    void loadUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadCrops = async () => {
      try {
        const list = await apiFetch("/api/crops");
        setCrops(list);
        setCrop((current: string) => current || list[0] || "");
      } catch {
        setErr("Backend or price data unavailable");
      }
    };
    void loadCrops();
  }, [user]);

  useEffect(() => {
    if (!crop || !user) return;
    setFc(null);
    void apiFetch(`/api/prices/history?crop=${encodeURIComponent(crop)}`)
      .then(setHist)
      .catch(() => setErr("Unable to load price history"));
  }, [crop, user]);

  const run = async () => {
    setErr("");
    try {
      const payload = await apiFetch("/api/forecast", {
        method: "POST",
        body: JSON.stringify({ crop, horizon: h })
      });
      setFc(payload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Forecast unavailable");
    }
  };

  const runDiseaseCheck = async () => {
    setDiseaseErr("");
    if (!diseaseFile) {
      setDiseaseErr(t("choose_image"));
      return;
    }
    try {
      const form = new FormData();
      form.append("file", diseaseFile);
      form.append("crop", crop || "");
      const result = await apiFetch("/api/disease/analyze", { method: "POST", body: form });
      setDiseaseResult(result);
    } catch (e) {
      setDiseaseErr(e instanceof Error ? e.message : "Disease detection unavailable");
    }
  };

  const data = [...(hist?.points || []).map((p: any) => ({ date: p.date, actual: p.modal_price })), ...(fc ? [{ date: fc.forecast_date, predicted: fc.predicted_price }] : [])];
  const card = { background: "#fff", borderRadius: 14, padding: 16, margin: "12px 0", boxShadow: "0 1px 4px #0002" };

  const logout = () => {
    localStorage.removeItem("agri_token");
    localStorage.removeItem("agri_refresh_token");
    setUser(null);
    setCrops([]);
    setCrop("");
    setHist(null);
    setFc(null);
    setErr("");
    setDiseaseFile(null);
    setDiseaseResult(null);
    setDiseaseErr("");
    setWatchLocation(false);
    setLocation(null);
    setLocationErr("");
    setNearby(null);
    lastNearbyLookup.current = 0;
  };

  if (!user) return <AuthView />;

  return <div style={{ maxWidth: 900, margin: "0 auto", padding: 12 }}>
    <header style={{ background: "#176B3A", color: "#fff", borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>AgriTech AI</h1>
          <div>{t("tag")}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span>{user.full_name}</span>
          <button onClick={logout} style={{ background: "#fff", color: "#176B3A", border: 0, borderRadius: 8, padding: "8px 12px", fontWeight: 600 }}>{t("logout")}</button>
          <select aria-label="language" value={i18n.language} onChange={e => { i18n.changeLanguage(e.target.value); localStorage.setItem("lang", e.target.value); }} style={{ padding: 8, borderRadius: 8 }}>
            <option value="en">English</option>
            <option value="te">తెలుగు</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
      </div>
    </header>
    {err && <div style={{ ...card, background: "#fdecea" }}>{err}</div>}
    <div style={card}>
      {hist?.label && <b style={{ color: "#c2410c" }}>{t("sample_prices")}</b>}
      <div>
        <label>{t("crop")} <select value={crop} onChange={e => setCrop(e.target.value)}>{crops.map(c => <option key={c}>{c}</option>)}</select></label>{" "}
        <label>{t("horizon")} <select value={h} onChange={e => setH(+e.target.value)}>{[7, 15, 30].map(x => <option key={x}>{x}</option>)}</select></label>{" "}
        <button onClick={run} style={{ background: "#176B3A", color: "#fff", border: 0, borderRadius: 8, padding: "10px 16px" }}>{t("go")}</button>
      </div>
      <div style={{ height: 320 }}><ResponsiveContainer><LineChart data={data}><XAxis dataKey="date" minTickGap={40} /><YAxis domain={["auto", "auto"]} /><Tooltip /><Legend />
        <Line dataKey="actual" name={t("observed")} stroke="#176B3A" dot={false} connectNulls /><Line dataKey="predicted" name={t("forecast")} stroke="#F2B544" strokeWidth={3} dot /></LineChart></ResponsiveContainer></div>
      {fc && <div><p>{t("latest_recorded")} ({fc.latest_input_date}): {fc.latest_actual_price} {hist?.unit} · {t("forecast_for")} {fc.forecast_date}: <b>{fc.predicted_price}</b> ({t(fc.direction)}) · {fc.model.name} v{fc.model.version}</p>
        <p>{t("uncertainty_text")}</p>{fc.evaluation && <p>{t("holdout_mae")} {fc.evaluation.test.mae.toFixed(1)} · {t("baseline_mae")} {fc.evaluation.baseline_persistence.mae.toFixed(1)}{fc.is_demo ? ` (${t("synthetic_data")})` : ""}</p>}</div>}
      <small>{t("note")}</small>
    </div>
    <div style={card}>
      <h3 style={{ marginTop: 0 }}>{t("location")}</h3>
      <button onClick={() => { setLocationErr(""); if (!watchLocation) { lastNearbyLookup.current = 0; setNearby(null); } setWatchLocation(value => !value); }} style={{ background: "#176B3A", color: "#fff", border: 0, borderRadius: 8, padding: "10px 16px" }}>
        {watchLocation ? t("stop_location") : t("share_location")}
      </button>
      <p><small>{t("location_privacy")}</small></p>
      {locationErr && <p role="alert" style={{ color: "#b91c1c" }}>{t(locationErr)}</p>}
      {watchLocation && !location && !locationErr && <p aria-live="polite">{t("location_waiting")}</p>}
      {location && <p aria-live="polite">
        {t("latitude")}: {location.coords.latitude.toFixed(5)} · {t("longitude")}: {location.coords.longitude.toFixed(5)} · {t("accuracy")}: {Math.round(location.coords.accuracy)} {t("meters")}
      </p>}
      {watchLocation && location && !nearby && !locationErr && <p aria-live="polite">{t("nearby_loading")}</p>}
      {nearby && <div>
        <h4>{t("your_area")}: {nearby.address || `${location?.coords.latitude.toFixed(3)}, ${location?.coords.longitude.toFixed(3)}`}</h4>
        <h4>{t("nearby_markets")}</h4>
        {nearby.markets.length ? <ul>{nearby.markets.map((market: any) => <li key={`${market.name}-${market.latitude}-${market.longitude}`}>
          <a href={market.map_url} target="_blank" rel="noreferrer">{market.name}</a> · {market.distance_km} {t("distance")}
        </li>)}</ul> : <p>{t("no_nearby_markets", { radius: nearby.radius_km })}</p>}
        <small>{t("market_source")}</small>
      </div>}
    </div>
    <div style={card}>
      <h3 style={{ marginTop: 0 }}>{t("disease")}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <select value={crop} onChange={e => setCrop(e.target.value)}>{crops.map(c => <option key={c}>{c}</option>)}</select>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setDiseaseFile(e.target.files?.[0] || null)} />
        <button onClick={runDiseaseCheck} style={{ background: "#ef4444", color: "#fff", border: 0, borderRadius: 8, padding: "10px 16px" }}>{t("analyze_image")}</button>
      </div>
      {diseaseErr && <p style={{ color: "#b91c1c", marginBottom: 0 }}>{diseaseErr}</p>}
      {diseaseResult && <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: diseaseResult.status === "healthy" ? "#ecfdf5" : "#fff7ed" }}>
        <strong>{diseaseResult.status === "healthy" ? t("healthy_crop") : t("possible_disease")}</strong>
        <p style={{ margin: "8px 0 4px" }}><b>{t(`diagnosis.${diseaseResult.disease}`, { defaultValue: diseaseResult.disease })}</b> · {t("confidence")} {Math.round(diseaseResult.confidence * 100)}%</p>
        <p style={{ margin: "6px 0" }}>{diseaseResult.status === "healthy" ? t("disease_healthy_message") : t("disease_possible_message", { disease: t(`diagnosis.${diseaseResult.disease}`, { defaultValue: diseaseResult.disease }), crop: diseaseResult.crop })}</p>
        <small>{diseaseResult.status === "healthy" ? t("disease_advice_healthy") : t("disease_advice_detected")}</small>
        {diseaseResult.demo && <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>{t("disease_disclaimer")}</div>}
      </div>}
    </div>
  </div>;
}

function App() {
  return <DashboardApp />;
}

createRoot(document.getElementById("root")!).render(<App />);
