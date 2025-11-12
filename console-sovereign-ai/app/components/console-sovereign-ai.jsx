"use client";
import React, {useMemo, useState, useEffect} from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "next/link";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Upload, Save, Play, Shield, Database, FileText, Scale, Activity, SlidersHorizontal, ListChecks, KeyRound, Lock, Info, Globe, Settings, LineChart } from "lucide-react";
import { LineChart as RLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ---------------------------------------------
// Default Policy (derived from lo-fi v0.3)
// ---------------------------------------------
const defaultPolicy = {
  version: "0.3",
  jurisdiction: "Indonesia",
  data_residency: "Indonesia-only (on-shore)",
  retention_days: 30,
  training_opt_in: false,
  pii_protection: {
    method: "Anonymization/Redaction",
    tooling: "Microsoft Presidio (text/images)",
    pii_categories: ["Name", "Phone", "Email", "ID Number", "Address", "Account Number"],
  },
  encryption: {
    at_rest: "AES-256",
    in_transit: "TLS 1.2+",
  },
  access_control: {
    model: "ABAC (role, sensitivity, location, time)",
    review_cycle_days: 90,
  },
  audit_trail: {
    enabled: true,
    retention_months: 12,
    export_format: ["CSV", "JSONL"],
  },
  transparency: {
    model_card_required: true,
    evaluations_published: [
      "Latency",
      "Accuracy",
      "Fairness (AIF360 DI)",
      "Toxicity",
    ],
  },
};

// Utility helpers
const download = (filename, content, type = "application/json") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const toCSV = (rows) => {
  const header = Object.keys(rows[0] || {}).join(",");
  const lines = rows.map((r) => Object.values(r).map((v) => JSON.stringify(v ?? "")).join(","));
  return [header, ...lines].join("\n");
};

const randomBetween = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);

// Types (lightweight)
/** @typedef {{ time: string, actor: string, action: string, resource: string, outcome: string }} AuditRow */

const initialAudit = [
  { time: "2025-11-10T20:05:00+07:00", actor: "svc-rag@bank.local", action: "READ", resource: "kb:limit-kartu-kredit", outcome: "ALLOW" },
  { time: "2025-11-10T20:05:02+07:00", actor: "svc-rag@bank.local", action: "RETRIEVE", resource: "vec:index#finance-faq", outcome: "ALLOW" },
  { time: "2025-11-10T20:05:03+07:00", actor: "svc-policy@bank.local", action: "FILTER", resource: "policy:pii-redaction", outcome: "APPLIED" },
];

// Chart seed
const initialLatency = Array.from({ length: 12 }).map((_, i) => ({
  t: i + 1,
  p50: randomBetween(60, 110),
  p95: randomBetween(180, 320),
}));

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icon className="h-4 w-4" />
      <h3 className="font-semibold text-base">{title}</h3>
      {subtitle && <span className="text-xs text-muted-foreground">— {subtitle}</span>}
    </div>
  );
}

function KeyValue({ k, v }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1 text-sm">
      <div className="text-muted-foreground">{k}</div>
      <div className="col-span-2">{v}</div>
    </div>
  );
}

// ---------------------------------------------
// Main UI
// ---------------------------------------------
export default function ConsoleSovereignAI() {
  const [policy, setPolicy] = useState(defaultPolicy);
  const [project, setProject] = useState({
    name: "CS-AI — FAQ Banking ID",
    sector: "Keuangan",
    model: "LLM — Multibahasa",
    region: "Jakarta (on‑shore)",
  });
  const [audit, setAudit] = useState(initialAudit);
  const [latency, setLatency] = useState(initialLatency);
  const [metrics, setMetrics] = useState({ em: 0.78, f1: 0.82, di: 0.86, tox: 0.006 });
  const [dataset, setDataset] = useState("Slang & Code‑mixing ID–EN");
  const [method, setMethod] = useState("RAG Multibahasa");
  const [prompt, setPrompt] = useState("limit cc gue kok turun ya? kemarin 50jt sekarang 30jt");

  // Derived FAIR checklist (very light scoring for demo)
  const fairScore = useMemo(() => {
    const findable = true; // metadata present
    const accessible = policy?.audit_trail?.enabled && !!policy?.access_control?.model;
    const interoperable = true; // JSON/CSV exports
    const reusable = policy?.transparency?.model_card_required;
    const score = [findable, accessible, interoperable, reusable].filter(Boolean).length / 4;
    return { findable, accessible, interoperable, reusable, score };
  }, [policy]);

  const handleImport = async (file = undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      setPolicy(obj);
      setAudit((a) => [
        { time: new Date().toISOString(), actor: "admin@console", action: "IMPORT_POLICY", resource: file.name, outcome: "SUCCESS" },
        ...a,
      ]);
    } catch (e) {
      alert("Gagal membaca policy.json");
    }
  };

  const handleExport = () => {
    download("policy.json", JSON.stringify(policy, null, 2));
  };

  const exportAudit = (fmt) => {
    if (fmt === "CSV") return download("audit.csv", toCSV(audit), "text/csv");
    const jsonl = audit.map((r) => JSON.stringify(r)).join("\n");
    return download("audit.jsonl", jsonl, "application/x-ndjson");
  };

  const runEvaluation = () => {
    // Simulate a run based on dataset + method choices
    const di = dataset.includes("Slang") ? randomBetween(0.82, 0.92) : randomBetween(0.88, 1.02);
    const em = method.includes("RAG") ? randomBetween(0.74, 0.83) : randomBetween(0.76, 0.86);
    const f1 = em + randomBetween(0.02, 0.05);
    const tox = randomBetween(0.003, 0.01);
    setMetrics({ em, f1, di, tox });
    // update latency trend
    setLatency((prev) => {
      const next = [...prev.slice(1), { t: prev[prev.length - 1].t + 1, p50: randomBetween(65, 115), p95: randomBetween(190, 310) }];
      return next;
    });
    // audit line
    setAudit((a) => [
      { time: new Date().toISOString(), actor: "svc-eval@console", action: "RUN_EVAL", resource: `${dataset} | ${method}` , outcome: "OK" },
      ...a,
    ]);
  };

  const residencyChoices = ["Indonesia‑only (on‑shore)", "Hybrid (prior approval)"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
          {/* Bungkus Ikon dan Teks dengan Link */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Shield className="h-5 w-5" />
          <span className="font-semibold">Console Sovereign AI</span>
          </Link>
          <Badge variant="secondary" className="ml-2">hi‑fi v0.9</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-4 w-4" /> Indonesia / On‑shore
            <Separator orientation="vertical" className="mx-2 h-4"/>
            <Info className="h-4 w-4" /> NIST AI RMF, FAIR, Model Cards
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-12">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4"/> Navigasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="#project" className="block rounded-md border p-2 text-sm hover:bg-slate-50">📁 Halaman Project</a>
              <a href="#policy" className="block rounded-md border p-2 text-sm hover:bg-slate-50">🔐 Data‑Policy</a>
              <a href="#bias" className="block rounded-md border p-2 text-sm hover:bg-slate-50">⚖️ Evaluasi Bias</a>
              <a href="#test" className="block rounded-md border p-2 text-sm hover:bg-slate-50">🧪 Skenario Uji</a>
              <a href="#audit" className="block rounded-md border p-2 text-sm hover:bg-slate-50">📜 Audit Trail</a>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4"/> Dokumentasi</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-2 text-muted-foreground">
              <p>• Model Cards (Mitchell et al., 2019)
                <br/>• NIST AI RMF 1.0
                <br/>• AIF360 fairness metrics
                <br/>• Locust load testing
                <br/>• FAIR Principles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main */}
        <div className="lg:col-span-9 space-y-6">
          {/* Project Page */}
          <Card id="project">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5"/> Halaman Project</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Nama Proyek</Label>
                <Input value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} />
              </div>
              <div>
                <Label>Sektor</Label>
                <Select value={project.sector} onValueChange={(v) => setProject({ ...project, sector: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Keuangan">Keuangan</SelectItem>
                    <SelectItem value="Kesehatan">Kesehatan</SelectItem>
                    <SelectItem value="Publik">Publik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model Utama</Label>
                <Select value={project.model} onValueChange={(v) => setProject({ ...project, model: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LLM — Bahasa Indonesia (on‑shore)">LLM — Bahasa Indonesia (on‑shore)</SelectItem>
                    <SelectItem value="LLM — Multibahasa">LLM — Multibahasa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Region Deploy</Label>
                <Select value={project.region} onValueChange={(v) => setProject({ ...project, region: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jakarta (on‑shore)">Jakarta (on‑shore)</SelectItem>
                    <SelectItem value="Surabaya DR">Surabaya DR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <SectionTitle icon={Info} title="Transparansi" subtitle="Model Card wajib & publikasi metrik"/>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">Model Card</Badge>
                  <Badge variant="outline">Risk Profile</Badge>
                  <Badge variant="outline">Evaluations</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Policy */}
          <Card id="policy">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5"/> Data‑Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data Residency</Label>
                  <Select value={policy.data_residency} onValueChange={(v) => setPolicy({ ...policy, data_residency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {residencyChoices.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">PP 71/2019 & UU PDP 27/2022 berlaku. Data sensitif tetap on‑shore.</p>
                </div>
                <div className="space-y-2">
                  <Label>Retention (hari)</Label>
                  <Input type="number" value={policy.retention_days} onChange={(e) => setPolicy({ ...policy, retention_days: +e.target.value })} />
                  <p className="text-xs text-muted-foreground">Log audit disimpan {policy.audit_trail.retention_months} bulan.</p>
                </div>

                <div className="space-y-2">
                  <Label>Training Opt‑in</Label>
                  <div className="flex items-center gap-3"><Switch checked={!!policy.training_opt_in} onCheckedChange={(v) => setPolicy({ ...policy, training_opt_in: v })} /><span className="text-sm">{policy.training_opt_in ? "ON (per‑dataset consent)" : "OFF (default)"}</span></div>
                  <p className="text-xs text-muted-foreground">Data pelanggan tidak digunakan melatih model tanpa persetujuan.</p>
                </div>
                <div className="space-y-2">
                  <Label>PII Handling</Label>
                  <Select value={policy.pii_protection?.method} onValueChange={(v) => setPolicy({ ...policy, pii_protection: { ...policy.pii_protection, method: v } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Anonymization/Redaction">Anonymization/Redaction (Presidio)</SelectItem>
                      <SelectItem value="Pseudonymization">Pseudonymization</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Deteksi PII di text/gambar sebelum indexing/training.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Policy JSON</CardTitle></CardHeader>
                  <CardContent>
                    <Textarea className="font-mono text-xs min-h-[180px]" value={JSON.stringify(policy, null, 2)} onChange={(e) => {
                      try { setPolicy(JSON.parse(e.target.value)); } catch {}
                    }} />
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4"/>Unduh JSON</Button>
                      <label className="inline-flex items-center gap-2 text-xs cursor-pointer border rounded-md px-3 py-2"><Upload className="h-4 w-4"/>Import JSON
                        <input type="file" accept="application/json" className="hidden" onChange={(e) => handleImport(e.target.files?.[0] || undefined)} />
                      </label>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Kontrol Akses & Audit</CardTitle></CardHeader>
                  <CardContent className="text-sm">
                    <KeyValue k="Access Model" v={policy.access_control?.model} />
                    <KeyValue k="Review Cycle" v={`${policy.access_control?.review_cycle_days} hari`} />
                    <KeyValue k="Audit" v={policy.audit_trail?.enabled ? "Enabled" : "Disabled"} />
                    <KeyValue k="Audit Retention" v={`${policy.audit_trail?.retention_months} bulan`} />
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => exportAudit("CSV")}>Export CSV</Button>
                      <Button size="sm" variant="secondary" onClick={() => exportAudit("JSONL")}>Export JSONL</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-dashed">
                <CardHeader className="pb-1"><CardTitle className="text-sm">FAIR Data Checklist</CardTitle></CardHeader>
                <CardContent className="text-sm">
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <div className="rounded-md border p-2">Findable: <b>{fairScore.findable ? "Yes" : "No"}</b></div>
                    <div className="rounded-md border p-2">Accessible: <b>{fairScore.accessible ? "Yes" : "No"}</b></div>
                    <div className="rounded-md border p-2">Interoperable: <b>{fairScore.interoperable ? "Yes" : "No"}</b></div>
                    <div className="rounded-md border p-2">Reusable: <b>{fairScore.reusable ? "Yes" : "No"}</b></div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Skor FAIR (heurstik): {(fairScore.score * 100).toFixed(0)}%</div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Bias & Evaluation */}
          <Card id="bias">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5"/> Evaluasi Bias & Akurasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label>Dataset Uji</Label>
                  <Select value={dataset} onValueChange={setDataset}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FAQ Banking — Bahasa Indonesia">FAQ Banking — Bahasa Indonesia</SelectItem>
                      <SelectItem value="Slang & Code‑mixing ID–EN">Slang & Code‑mixing ID–EN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Metode</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RAG Multibahasa">RAG Multibahasa</SelectItem>
                      <SelectItem value="Fine‑tuning Lokal">Fine‑tuning Lokal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prompt Uji</Label>
                  <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={runEvaluation}><Play className="mr-2 h-4 w-4"/>Run Evaluation</Button>
                <Badge variant="outline" className="text-xs">Akurasi (EM): {(metrics.em * 100).toFixed(1)}%</Badge>
                <Badge variant="outline" className="text-xs">F1: {(metrics.f1 * 100).toFixed(1)}%</Badge>
                <Badge variant="outline" className="text-xs">Fairness (DI): {metrics.di.toFixed(2)} (target 0.80–1.25)</Badge>
                <Badge variant="outline" className="text-xs">Toxicity: {(metrics.tox * 100).toFixed(2)}%</Badge>
              </div>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><LineChart className="h-4 w-4"/> Latency Trend</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RLineChart data={latency}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="t" label={{ value: "min", position: "insideBottomRight", offset: -5 }} />
                        <YAxis domain={[0, 400]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="p50" dot={false} />
                        <Line type="monotone" dataKey="p95" dot={false} />
                      </RLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="text-xs text-muted-foreground">Metrik fairness mengikuti konsep Disparate Impact (AIF360). Akurasi memakai Exact Match/F1 (🤗 Evaluate). Latensi diukur p50/p95 per tahap pipeline.</div>
            </CardContent>
          </Card>

          {/* Test Scenario */}
          <Card id="test">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5"/> Skenario Uji — Customer Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SectionTitle icon={ListChecks} title="Deskripsi" subtitle="RAG multibahasa + kebijakan on‑shore"/>
              <ul className="list-disc pl-6 text-sm">
                <li>Query: campuran slang Indonesia + istilah Inggris.</li>
                <li>Retrieval dari kebijakan internal (on‑shore), jawaban tunduk pada SOP & redaksi PII.</li>
                <li>Logging akses (AU‑2..AU‑6), evaluasi EM/F1, DI, Toxicity.</li>
              </ul>
              <SectionTitle icon={SlidersHorizontal} title="Prompt & Konteks"/>
              <Textarea className="font-mono text-xs" rows={5} value={`System: Kamu asisten CS bank. Jawab sopan & aman.\nPolicy: Jangan keluarkan data pribadi. Jika tidak yakin, jelaskan langkah verifikasi di aplikasi.\nUser: ${prompt}\nContext (retrieved): [dokumen kebijakan penyesuaian limit, tanggal, syarat]`} readOnly />
              <div className="text-xs text-muted-foreground">Catatan: respons aktual didelegasikan ke pipeline inference; prototipe ini memfokuskan kontrol data & evaluasi.</div>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card id="audit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-2 text-left">Time</th>
                      <th className="p-2 text-left">Actor</th>
                      <th className="p-2 text-left">Action</th>
                      <th className="p-2 text-left">Resource</th>
                      <th className="p-2 text-left">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 whitespace-nowrap">{r.time}</td>
                        <td className="p-2">{r.actor}</td>
                        <td className="p-2">{r.action}</td>
                        <td className="p-2">{r.resource}</td>
                        <td className="p-2">{r.outcome}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Footer / Iteration */}
          <div className="text-xs text-muted-foreground grid gap-1">
            <div>Iterasi: v0.7 (UI grid + chart) → v0.8 (import/export JSON, FAIR checklist) → <b>v0.9</b> (latency trend, audit export, DI metrics, hi‑fi skin).</div>
            <div>Rujukan: Model Cards (Mitchell et al.), NIST AI RMF 1.0, AIF360, Locust, FAIR Principles.</div>
          </div>
        </div>
      </div>
    </div>
  );
}