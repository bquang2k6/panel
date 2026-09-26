"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Code, Eye, AlertCircle, Check, Sparkles } from "lucide-react";
import { overlayActions, sectionActions } from "@/features/datacenter/actions";
import type {
  OverlayItem,
  OverlayPayload,
  OverlaySection,
} from "@/features/datacenter/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

function parseJsonSafe(str: string, fallback: any = {}): { parsed: any; error: string | null } {
  try {
    const parsed = JSON.parse(str);
    return { parsed, error: null };
  } catch (err: any) {
    return { parsed: fallback, error: err?.message || "Cú pháp JSON không hợp lệ" };
  }
}

function stringifyPretty(val: any): string {
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return "{}";
  }
}

function buildDefaultForm(): OverlayPayload {
  return {
    section_id: "",
    overlay_id: "",
    source: "remote",
    order_id: 0,
    active: true,
    type: "decorative",
    background: {
      colors: ["#F8C8DC", "#E75480"],
    },
    icon: {
      type: "emoji",
      data: "⭐",
    },
    text: "",
    text_color: "",
    effect: "",
    is_editable: false,
    max_lines: 1,
    daily_start_hour: null,
    daily_end_hour: null,
    start_at: null,
    end_at: null,
  };
}

function toLocalDatetimeStr(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
}

interface OverlayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overlay: OverlayItem | null;
  onSuccess: (item: OverlayItem, isEdit: boolean) => Promise<void> | void;
}

export function OverlayDialog({ open, onOpenChange, overlay, onSuccess }: OverlayDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OverlayPayload>(buildDefaultForm());
  const [sections, setSections] = useState<OverlaySection[]>([]);

  // Raw JSON strings for Background and Icon editors
  const [bgJsonStr, setBgJsonStr] = useState<string>("{}");
  const [bgJsonErr, setBgJsonErr] = useState<string | null>(null);

  const [iconJsonStr, setIconJsonStr] = useState<string>("{}");
  const [iconJsonErr, setIconJsonErr] = useState<string | null>(null);

  const loadSections = useCallback(async () => {
    try {
      const data = await sectionActions.getAll();
      setSections(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadSections();

    if (overlay) {
      const bgObj = typeof overlay.background === "string" 
        ? parseJsonSafe(overlay.background, {}).parsed 
        : (overlay.background || {});

      const iconObj = typeof overlay.icon === "string" 
        ? parseJsonSafe(overlay.icon, {}).parsed 
        : (overlay.icon || {});

      setFormData({
        section_id: overlay.section_id || "",
        overlay_id: overlay.overlay_id || "",
        source: overlay.source || "remote",
        order_id: overlay.order_id ?? 0,
        active: overlay.active ?? true,
        type: overlay.type || "decorative",
        background: bgObj,
        icon: iconObj,
        text: overlay.text || "",
        text_color: overlay.text_color || "",
        effect: overlay.effect || "",
        is_editable: overlay.is_editable ?? false,
        max_lines: overlay.max_lines ?? 1,
        daily_start_hour: overlay.daily_start_hour ?? null,
        daily_end_hour: overlay.daily_end_hour ?? null,
        start_at: overlay.start_at || null,
        end_at: overlay.end_at || null,
      });

      setBgJsonStr(stringifyPretty(bgObj));
      setBgJsonErr(null);

      setIconJsonStr(stringifyPretty(iconObj));
      setIconJsonErr(null);
    } else {
      const defaults = buildDefaultForm();
      setFormData(defaults);
      setBgJsonStr(stringifyPretty(defaults.background));
      setBgJsonErr(null);
      setIconJsonStr(stringifyPretty(defaults.icon));
      setIconJsonErr(null);
    }
    setError(null);
  }, [open, overlay, loadSections]);

  function setField<K extends keyof OverlayPayload>(key: K, val: OverlayPayload[K]) {
    setFormData((prev) => ({ ...prev, [key]: val }));
  }

  // Handle Background JSON change
  function handleBgJsonChange(val: string) {
    setBgJsonStr(val);
    const { parsed, error: parseErr } = parseJsonSafe(val, null);
    setBgJsonErr(parseErr);
    if (!parseErr && parsed) {
      setField("background", parsed);
    }
  }

  function formatBgJson() {
    const { parsed, error: parseErr } = parseJsonSafe(bgJsonStr, null);
    if (!parseErr && parsed) {
      setBgJsonStr(stringifyPretty(parsed));
      setBgJsonErr(null);
    }
  }

  // Handle Icon JSON change
  function handleIconJsonChange(val: string) {
    setIconJsonStr(val);
    const { parsed, error: parseErr } = parseJsonSafe(val, null);
    setIconJsonErr(parseErr);
    if (!parseErr && parsed) {
      setField("icon", parsed);
    }
  }

  function formatIconJson() {
    const { parsed, error: parseErr } = parseJsonSafe(iconJsonStr, null);
    if (!parseErr && parsed) {
      setIconJsonStr(stringifyPretty(parsed));
      setIconJsonErr(null);
    }
  }

  // Quick preset helpers
  function applyBgPreset(type: "gradient" | "image_local" | "image_url") {
    let preset = {};
    if (type === "gradient") {
      preset = { colors: ["#F8C8DC", "#E75480"] };
    } else if (type === "image_local") {
      preset = {
        image: { data: "star_sign_background", type: "image", source: "local" },
        colors: ["#F8C8DC", "#E75480"]
      };
    } else if (type === "image_url") {
      preset = {
        image: { data: "https://example.com/bg.png", type: "image", source: "url" },
        colors: ["#121212"]
      };
    }
    setField("background", preset);
    setBgJsonStr(stringifyPretty(preset));
    setBgJsonErr(null);
  }

  function applyIconPreset(type: "image_url" | "emoji" | "image_local") {
    let preset = {};
    if (type === "image_url") {
      preset = {
        data: "https://storage.googleapis.com/locket-public/overlays/star_signs/Libra.png",
        type: "image",
        source: "url"
      };
    } else if (type === "emoji") {
      preset = { data: "🪷", type: "emoji" };
    } else if (type === "image_local") {
      preset = { data: "star_sign_libra", type: "image", source: "local" };
    }
    setField("icon", preset);
    setIconJsonStr(stringifyPretty(preset));
    setIconJsonErr(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate background & icon JSON
    const bgRes = parseJsonSafe(bgJsonStr, null);
    if (bgRes.error || !bgRes.parsed) {
      setError(`Lỗi JSON Background: ${bgRes.error}`);
      return;
    }

    const iconRes = parseJsonSafe(iconJsonStr, null);
    if (iconRes.error || !iconRes.parsed) {
      setError(`Lỗi JSON Icon: ${iconRes.error}`);
      return;
    }

    const payload: OverlayPayload = {
      ...formData,
      background: bgRes.parsed,
      icon: iconRes.parsed,
    };

    try {
      setLoading(true);
      let savedItem: OverlayItem;
      const isEdit = !!overlay;
      if (overlay) {
        savedItem = await overlayActions.update(overlay.uid, payload);
      } else {
        savedItem = await overlayActions.create(payload);
      }
      await onSuccess(savedItem, isEdit);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra khi lưu.");
    } finally {
      setLoading(false);
    }
  }

  // Parsed bg & icon for live visual preview
  const parsedBg = parseJsonSafe(bgJsonStr, {}).parsed || {};
  const parsedIcon = parseJsonSafe(iconJsonStr, {}).parsed || {};

  const bgColors: string[] = Array.isArray(parsedBg.colors) ? parsedBg.colors : [];
  const bgImg = parsedBg.image?.data || parsedBg.image?.url || parsedBg.url;

  const iconType = parsedIcon.type || (typeof parsedIcon.data === "string" && parsedIcon.data.startsWith("http") ? "image" : "emoji");
  const iconData = parsedIcon.data;
  const isImageIcon =
    iconType === "image_icon" ||
    iconType === "image_gif" ||
    iconType === "image" ||
    (typeof iconData === "string" && iconData.startsWith("http"));

  const hasBg = bgColors.length > 0;
  const backgroundStyle = hasBg
    ? bgColors.length === 1
      ? bgColors[0]
      : `linear-gradient(to bottom, ${bgColors[0]}, ${bgColors[1] || bgColors[0]})`
    : "transparent";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Sticky Header & Theme Preview Banner */}
        <div className="sticky top-0 z-20 bg-background backdrop-blur-md border-b px-6 py-4 space-y-3 shadow-xs">
          <DialogHeader className="p-0">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-5 w-5 text-primary" />
              {overlay ? `Chỉnh Sửa Overlay (${overlay.overlay_id})` : "Tạo Overlay Mới"}
            </DialogTitle>
          </DialogHeader>

          {/* Theme Banner Pill Preview */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/40 shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-primary" /> Theme Preview:
            </span>
            <div
              className={`p-2 rounded-3xl font-semibold w-fit px-3 flex justify-center items-center text-xs transition-all ${
                hasBg ? "bg-black/10 shadow-xs border border-white/10" : ""
              }`}
              style={{
                background: backgroundStyle,
              }}
            >
              {isImageIcon && typeof iconData === "string" && iconData.startsWith("http") ? (
                <div
                  className="flex flex-row justify-center items-center gap-2 px-2"
                  style={{ color: formData.text_color || "inherit" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={iconData} alt="" className="w-5 h-5 object-contain" />
                  <span>{formData.text || "Caption"}</span>
                </div>
              ) : (
                <span className="px-2 flex items-center gap-1.5" style={{ color: formData.text_color || "inherit" }}>
                  {iconData && <span>{iconData}</span>}
                  <span>{formData.text || "Caption"}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6 pt-4">

          {/* ── Section 1: Định danh & Type ── */}
          <fieldset className="border rounded-xl p-3.5 space-y-3 bg-card shadow-xs">
            <legend className="text-xs font-bold px-1.5 text-primary uppercase tracking-wider">Định danh & Loại</legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Overlay ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="vd: star_sign_libra"
                  value={formData.overlay_id}
                  onChange={(e) => setField("overlay_id", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Section (Danh mục)</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.section_id}
                  onChange={(e) => setField("section_id", e.target.value)}
                >
                  <option value="">— Không có section —</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Source</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.source}
                  onChange={(e) => setField("source", e.target.value)}
                >
                  <option value="remote">remote</option>
                  <option value="local">local</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.type}
                  onChange={(e) => setField("type", e.target.value)}
                >
                  <option value="decorative">decorative</option>
                  <option value="template">template</option>
                  <option value="frame">frame</option>
                  <option value="badge">badge</option>
                  <option value="sticker">sticker</option>
                  <option value="text">text</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Order ID</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.order_id}
                  onChange={(e) => setField("order_id", Number(e.target.value))}
                />
              </div>
            </div>
          </fieldset>

          {/* ── Section 2: Background (Edit JSON + Visual Preview) ── */}
          <fieldset className="border rounded-xl p-3.5 space-y-3 bg-card shadow-xs">
            <div className="flex items-center justify-between">
              <legend className="text-xs font-bold px-1.5 text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5" />
                Background JSON
              </legend>
              <div className="flex gap-1.5">
                <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => applyBgPreset("gradient")}>
                  Màu Gradient
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => applyBgPreset("image_local")}>
                  Ảnh local + màu
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => applyBgPreset("image_url")}>
                  Ảnh URL
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px] px-2" onClick={formatBgJson}>
                  Format JSON
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Textarea Editor */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <Label className="text-xs font-medium text-muted-foreground">Nhập JSON</Label>
                  {bgJsonErr ? (
                    <span className="text-destructive flex items-center gap-1 text-[10px]">
                      <AlertCircle className="h-3 w-3" /> {bgJsonErr}
                    </span>
                  ) : (
                    <span className="text-emerald-500 flex items-center gap-1 text-[10px]">
                      <Check className="h-3 w-3" /> Hợp lệ
                    </span>
                  )}
                </div>
                <textarea
                  className="w-full h-36 font-mono text-xs p-2.5 rounded-lg border border-input bg-muted/40 focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                  value={bgJsonStr}
                  onChange={(e) => handleBgJsonChange(e.target.value)}
                  placeholder={`{\n  "image": { "data": "star_sign_background", "type": "image", "source": "local" },\n  "colors": ["#F8C8DC", "#E75480"]\n}`}
                />
              </div>

              {/* Live Visual Preview */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> Live Preview
                </Label>
                <div className="h-36 rounded-lg border bg-muted/20 p-3 flex flex-col justify-between overflow-hidden">
                  <div>
                    {bgColors.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Màu sắc ({bgColors.length})</span>
                        <div
                          className="h-8 w-full rounded-md border shadow-xs transition-all"
                          style={{
                            background: bgColors.length === 1 ? bgColors[0] : `linear-gradient(to right, ${bgColors.join(", ")})`
                          }}
                        />
                        <div className="flex flex-wrap gap-1">
                          {bgColors.map((c, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] font-mono gap-1 py-0">
                              <span className="h-2 w-2 rounded-full inline-block" style={{ background: c }} />
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Không có mảng colors</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/50 text-xs">
                    {bgImg ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Ảnh nền:</span>
                        {typeof bgImg === "string" && bgImg.startsWith("http") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={bgImg} alt="bg" className="h-6 w-12 object-cover rounded border" />
                        ) : (
                          <Badge variant="secondary" className="text-[10px] font-mono">{String(bgImg)}</Badge>
                        )}
                        {parsedBg.image?.source && <span className="text-[10px] text-muted-foreground">({parsedBg.image.source})</span>}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Không có ảnh nền</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

          {/* ── Section 3: Icon (Edit JSON + Visual Preview) ── */}
          <fieldset className="border rounded-xl p-3.5 space-y-3 bg-card shadow-xs">
            <div className="flex items-center justify-between">
              <legend className="text-xs font-bold px-1.5 text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5" />
                Icon JSON
              </legend>
              <div className="flex gap-1.5">
                <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => applyIconPreset("image_url")}>
                  Ảnh URL
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => applyIconPreset("emoji")}>
                  Emoji
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => applyIconPreset("image_local")}>
                  Ảnh Local
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px] px-2" onClick={formatIconJson}>
                  Format JSON
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Textarea Editor */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <Label className="text-xs font-medium text-muted-foreground">Nhập JSON</Label>
                  {iconJsonErr ? (
                    <span className="text-destructive flex items-center gap-1 text-[10px]">
                      <AlertCircle className="h-3 w-3" /> {iconJsonErr}
                    </span>
                  ) : (
                    <span className="text-emerald-500 flex items-center gap-1 text-[10px]">
                      <Check className="h-3 w-3" /> Hợp lệ
                    </span>
                  )}
                </div>
                <textarea
                  className="w-full h-36 font-mono text-xs p-2.5 rounded-lg border border-input bg-muted/40 focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                  value={iconJsonStr}
                  onChange={(e) => handleIconJsonChange(e.target.value)}
                  placeholder={`{\n  "data": "https://storage.googleapis.com/...",\n  "type": "image",\n  "source": "url"\n}`}
                />
              </div>

              {/* Live Visual Preview */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> Live Preview
                </Label>
                <div className="h-36 rounded-lg border bg-muted/20 p-3 flex items-center gap-4 overflow-hidden">
                  <div className="h-20 w-20 rounded-xl border bg-white shadow-xs flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
                    {iconType === "emoji" ? (
                      <span className="text-4xl leading-none select-none">{iconData || "❓"}</span>
                    ) : (iconType === "image" || iconType === "image_icon" || iconType === "image_gif") && typeof iconData === "string" && iconData.startsWith("http") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={iconData}
                        alt="icon preview"
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="text-center p-1">
                        <span className="text-[10px] font-mono text-muted-foreground break-all">{iconData || "No data"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1 text-xs">
                    <div className="flex gap-1 items-center">
                      <Badge variant="outline" className="text-[10px]">{iconType}</Badge>
                      {parsedIcon.source && <Badge variant="secondary" className="text-[10px]">{parsedIcon.source}</Badge>}
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground truncate" title={String(iconData)}>
                      Data: {String(iconData || "—")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

          {/* ── Section 4: Văn bản & hiển thị ── */}
          <fieldset className="border rounded-xl p-3.5 space-y-3 bg-card shadow-xs">
            <legend className="text-xs font-bold px-1.5 text-primary uppercase tracking-wider">Văn bản & hiển thị</legend>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Text (Văn bản hiển thị)</Label>
              <Input
                placeholder="vd: Xin chào 2026!"
                value={formData.text}
                onChange={(e) => setField("text", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Màu chữ (text_color)</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={formData.text_color || "#000000"}
                    onChange={(e) => setField("text_color", e.target.value)}
                    className="w-9 h-9 rounded-md cursor-pointer border border-input p-0.5"
                  />
                  <Input
                    value={formData.text_color}
                    onChange={(e) => setField("text_color", e.target.value)}
                    placeholder="#000000"
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Max lines</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.max_lines}
                  onChange={(e) => setField("max_lines", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Hiệu ứng (effect)</Label>
              <Input
                placeholder="vd: sparkle_gold, neon_pulse..."
                value={formData.effect}
                onChange={(e) => setField("effect", e.target.value)}
              />
            </div>
          </fieldset>

          {/* ── Section 5: Thời gian hiển thị ── */}
          <fieldset className="border rounded-xl p-3.5 space-y-3 bg-card shadow-xs">
            <legend className="text-xs font-bold px-1.5 text-primary uppercase tracking-wider">Thời gian hiển thị</legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Bắt đầu (start_at)</Label>
                <Input
                  type="datetime-local"
                  value={toLocalDatetimeStr(formData.start_at)}
                  onChange={(e) => setField("start_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Kết thúc (end_at)</Label>
                <Input
                  type="datetime-local"
                  value={toLocalDatetimeStr(formData.end_at)}
                  onChange={(e) => setField("end_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Giờ bắt đầu hàng ngày (daily_start_hour)</Label>
                <Input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  placeholder="vd: 7.5 = 7:30 AM"
                  value={formData.daily_start_hour ?? ""}
                  onChange={(e) => setField("daily_start_hour", e.target.value === "" ? null : Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Giờ kết thúc hàng ngày (daily_end_hour)</Label>
                <Input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  placeholder="vd: 22 = 10:00 PM"
                  value={formData.daily_end_hour ?? ""}
                  onChange={(e) => setField("daily_end_hour", e.target.value === "" ? null : Number(e.target.value))}
                />
              </div>
            </div>
          </fieldset>

          {/* ── Section 6: Trạng thái ── */}
          <div className="flex items-center gap-8 px-1 py-1">
            <div className="flex items-center gap-2">
              <Switch
                id="ov-active-sw"
                checked={formData.active}
                onCheckedChange={(v) => setField("active", v)}
              />
              <Label htmlFor="ov-active-sw" className="text-xs cursor-pointer font-medium">Kích hoạt (active)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="ov-editable-sw"
                checked={formData.is_editable}
                onCheckedChange={(v) => setField("is_editable", v)}
              />
              <Label htmlFor="ov-editable-sw" className="text-xs cursor-pointer font-medium">Cho phép sửa (is_editable)</Label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary min-w-[110px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : overlay ? "Cập Nhật" : "Tạo Mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
