import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

i18n.use(initReactI18next).init({ lng: localStorage.getItem("lang") || "en", fallbackLng: "en", resources: {
  en: { translation: { tag: "Smart Insights. Healthy Crops. Better Profits.", crop: "Crop", horizon: "Forecast days", go: "Get forecast", disease: "Disease detection", unavail: "Disease model unavailable", note: "Forecasts are estimates, not guarantees." } },
  hi: { translation: { tag: "स्मार्ट जानकारी। स्वस्थ फसल। बेहतर लाभ।", crop: "फसल", horizon: "पूर्वानुमान दिन", go: "पूर्वानुमान देखें", disease: "रोग पहचान", unavail: "रोग मॉडल उपलब्ध नहीं", note: "पूर्वानुमान अनुमान हैं, गारंटी नहीं।" } },
  te: { translation: { tag: "స్మార్ట్ అంతర్దృష్టి. ఆరోగ్యకరమైన పంటలు. మెరుగైన లాభాలు.", crop: "పంట", horizon: "అంచనా రోజులు", go: "అంచనా చూడండి", disease: "వ్యాధి గుర్తింపు", unavail: "వ్యాధి మోడల్ అందుబాటులో లేదు", note: "అంచనాలు కేవలం అంచనాలే, హామీలు కాదు." } } } });

function App() {
  const { t } = useTranslation();
  const [crops, setCrops] = useState<string[]>([]); const [crop, setCrop] = useState(""); const [h, setH] = useState(7);
  const [hist, setHist] = useState<any>(null); const [fc, setFc] = useState<any>(null); const [err, setErr] = useState("");
  useEffect(() => { fetch("/api/crops").then(r => r.json()).then(c => { setCrops(c); setCrop(c[0]); }).catch(() => setErr("Backend or price data unavailable")); }, []);
  useEffect(() => { if (crop) { setFc(null); fetch(`/api/prices/history?crop=${crop}`).then(r => r.json()).then(setHist); } }, [crop]);
  const run = async () => { setErr(""); const r = await fetch("/api/forecast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ crop, horizon: h }) }); const j = await r.json(); r.ok ? setFc(j) : setErr(j.detail); };
  const data = [...(hist?.points || []).map((p: any) => ({ date: p.date, actual: p.modal_price })), ...(fc ? [{ date: fc.forecast_date, predicted: fc.predicted_price }] : [])];
  const card = { background: "#fff", borderRadius: 14, padding: 16, margin: "12px 0", boxShadow: "0 1px 4px #0002" };
  return <div style={{ maxWidth: 900, margin: "0 auto", padding: 12 }}>
    <header style={{ background: "#176B3A", color: "#fff", borderRadius: 14, padding: 16 }}><h1 style={{ margin: 0 }}>AgriVision AI</h1><div>{t("tag")}</div>
      <select aria-label="language" value={i18n.language} onChange={e => { i18n.changeLanguage(e.target.value); localStorage.setItem("lang", e.target.value); }}><option value="en">English</option><option value="te">తెలుగు</option><option value="hi">हिन्दी</option></select></header>
    {err && <div style={{ ...card, background: "#fdecea" }}>{err}</div>}
    <div style={card}>
      {hist?.label && <b style={{ color: "#c2410c" }}>{hist.label}</b>}
      <div><label>{t("crop")} <select value={crop} onChange={e => setCrop(e.target.value)}>{crops.map(c => <option key={c}>{c}</option>)}</select></label>{" "}
        <label>{t("horizon")} <select value={h} onChange={e => setH(+e.target.value)}>{[7, 15, 30].map(x => <option key={x}>{x}</option>)}</select></label>{" "}
        <button onClick={run} style={{ background: "#176B3A", color: "#fff", border: 0, borderRadius: 8, padding: "10px 16px" }}>{t("go")}</button></div>
      <div style={{ height: 320 }}><ResponsiveContainer><LineChart data={data}><XAxis dataKey="date" minTickGap={40} /><YAxis domain={["auto", "auto"]} /><Tooltip /><Legend />
        <Line dataKey="actual" name="Observed" stroke="#176B3A" dot={false} connectNulls /><Line dataKey="predicted" name="Forecast" stroke="#F2B544" strokeWidth={3} dot /></LineChart></ResponsiveContainer></div>
      {fc && <div><p>Latest recorded ({fc.latest_input_date}): {fc.latest_actual_price} {hist?.unit} · Forecast for {fc.forecast_date}: <b>{fc.predicted_price}</b> ({fc.direction}) · {fc.model.name} v{fc.model.version}</p>
        <p>{fc.uncertainty}</p>{fc.evaluation && <p>Held-out test MAE {fc.evaluation.test.mae.toFixed(1)} vs persistence baseline {fc.evaluation.baseline_persistence.mae.toFixed(1)}{fc.is_demo ? " (synthetic demo data)" : ""}</p>}</div>}
      <small>{t("note")}</small></div>
    <div style={card}><h3>{t("disease")}</h3><p>{t("unavail")}</p></div>
  </div>;
}
createRoot(document.getElementById("root")!).render(<App />);
