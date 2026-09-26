"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Sparkles,
  Layers,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  Eye,
} from "lucide-react";

import { overlayActions, sectionActions } from "@/features/datacenter/actions";
import type { OverlayItem, OverlaySection, OverlayBackground, OverlayIcon } from "@/features/datacenter/types";
import { OverlayDialog } from "@/components/datacenter/overlay-dialog";
import { SectionDialog } from "@/components/datacenter/section-dialog";

import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";

type Tab = "overlays" | "sections";

// Helper: parse JSONB field
function parseJsonb<T>(val: T | string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === "string") {
    try { return JSON.parse(val) as T; } catch { return fallback; }
  }
  return val as T;
}

// Cột Preview theme pill dạng rounded-3xl với gradient & icon + caption
function renderThemePreview(item: OverlayItem) {
  const bg = parseJsonb<OverlayBackground>(item.background, {});
  const icon = parseJsonb<OverlayIcon>(item.icon, {});

  const colors: string[] = Array.isArray(bg.colors) ? bg.colors : [];
  const colorTop = colors[0];
  const colorBottom = colors[1] || colors[0];

  const iconType = icon.type || (typeof icon.data === "string" && icon.data.startsWith("http") ? "image" : "emoji");
  const iconData = icon.data;
  const isImageIcon =
    iconType === "image_icon" ||
    iconType === "image_gif" ||
    iconType === "image" ||
    (typeof iconData === "string" && iconData.startsWith("http"));

  const textColor = item.text_color || "inherit";
  const caption = item.text || "Caption";

  const hasBg = colors.length > 0;
  const backgroundStyle = hasBg
    ? colors.length === 1
      ? colors[0]
      : `linear-gradient(to bottom, ${colorTop}, ${colorBottom})`
    : "transparent";

  return (
    <div
      className={`p-2 rounded-3xl font-semibold w-fit px-3 flex justify-center items-center text-xs ${
        hasBg ? "bg-black/10 shadow-xs border border-white/10" : ""
      }`}
      style={{
        background: backgroundStyle,
      }}
    >
      {isImageIcon && typeof iconData === "string" && iconData.startsWith("http") ? (
        <div
          className="flex flex-row justify-center items-center gap-2 px-2"
          style={{ color: textColor }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={iconData} alt="" className="w-5 h-5 object-contain" />
          <span>{caption}</span>
        </div>
      ) : (
        <span className="px-2 flex items-center gap-1.5" style={{ color: textColor }}>
          {iconData && <span>{iconData}</span>}
          <span>{caption}</span>
        </span>
      )}
    </div>
  );
}

// Render màu background dạng swatches + gradient bar + image preview nếu có
function BgPreview({ bg }: { bg: OverlayBackground | string | null }) {
  const parsed = parseJsonb<OverlayBackground>(bg, {});
  const colors: string[] = Array.isArray(parsed.colors) ? parsed.colors : [];
  const imgObj = parsed.image;
  const imgData = typeof imgObj === "object" ? imgObj?.data : parsed.url || imgObj;

  if (colors.length === 0 && !imgData) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[90px]">
      {colors.length > 0 && (
        <div className="space-y-1">
          <div
            className="h-4 w-20 rounded border shadow-xs"
            style={{ background: colors.length === 1 ? colors[0] : `linear-gradient(to right, ${colors.join(", ")})` }}
          />
          <div className="flex gap-1 flex-wrap">
            {colors.map((c, i) => (
              <span key={i} title={c} className="inline-block h-3 w-3 rounded-full border border-white/30 shadow-xs" style={{ background: c }} />
            ))}
          </div>
        </div>
      )}
      {imgData && (
        <div className="flex items-center gap-1">
          {typeof imgData === "string" && imgData.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgData} alt="bg" className="h-6 w-10 object-cover rounded border bg-white" />
          ) : (
            <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 truncate max-w-[90px]">
              {String(imgData)}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Render icon — emoji cỡ lớn, image dùng thẻ <img> nếu là URL hoặc badge nếu là local
function IconPreview({ icon }: { icon: OverlayIcon | string | null }) {
  const parsed = parseJsonb<OverlayIcon>(icon, { type: "none", data: "" });
  if (!parsed || !parsed.data) return <span className="text-muted-foreground text-xs">—</span>;

  const type = parsed.type || (typeof parsed.data === "string" && parsed.data.startsWith("http") ? "image" : "emoji");

  if (type === "emoji") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-2xl leading-none select-none">{parsed.data}</span>
        <span className="text-[10px] text-muted-foreground font-mono">emoji</span>
      </div>
    );
  }

  if (type === "image" || type === "image_icon" || type === "image_gif") {
    const isUrl = typeof parsed.data === "string" && parsed.data.startsWith("http");
    return (
      <div className="flex items-center gap-2">
        {isUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={parsed.data}
            alt="icon"
            className="h-8 w-8 rounded-md object-contain border bg-white shadow-xs"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <Badge variant="outline" className="text-[10px] font-mono max-w-[120px] truncate">
            {parsed.data}
          </Badge>
        )}
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground font-mono">{type}</span>
          {parsed.source && <span className="text-[9px] text-muted-foreground">({parsed.source})</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-foreground font-mono">{parsed.data}</span>
    </div>
  );
}

export default function OverlaysPage() {
  const [tab, setTab] = useState<Tab>("overlays");

  // Data states
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [overlayLoading, setOverlayLoading] = useState(true);
  const [openOverlay, setOpenOverlay] = useState(false);
  const [editingOverlay, setEditingOverlay] = useState<OverlayItem | null>(null);

  // Sections state
  const [sections, setSections] = useState<OverlaySection[]>([]);
  const [sectionLoading, setSectionLoading] = useState(true);
  const [openSection, setOpenSection] = useState(false);
  const [editingSection, setEditingSection] = useState<OverlaySection | null>(null);

  // Filter & Search states
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchOverlays = useCallback(async () => {
    try {
      setOverlayLoading(true);
      setOverlays(await overlayActions.getAll());
    } catch (e) { console.error(e); }
    finally { setOverlayLoading(false); }
  }, []);

  const fetchSections = useCallback(async () => {
    try {
      setSectionLoading(true);
      setSections(await sectionActions.getAll());
    } catch (e) { console.error(e); }
    finally { setSectionLoading(false); }
  }, []);

  useEffect(() => { fetchOverlays(); fetchSections(); }, [fetchOverlays, fetchSections]);

  // Handle Search Trigger
  function handleSearchSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setAppliedSearch(searchInput.trim());
    setPage(1);
  }

  function handleResetFilters() {
    setSearchInput("");
    setAppliedSearch("");
    setSelectedSection("ALL");
    setPage(1);
  }

  function handleOverlaySaved(savedItem: OverlayItem, isEdit: boolean) {
    if (isEdit) {
      setOverlays((prev) => prev.map((item) => (item.uid === savedItem.uid ? savedItem : item)));
    } else {
      setOverlays((prev) => [savedItem, ...prev.filter((item) => item.uid !== savedItem.uid)]);
    }
  }

  function handleSectionSaved(savedSec: OverlaySection, isEdit: boolean) {
    if (isEdit) {
      setSections((prev) => prev.map((s) => (s.id === savedSec.id ? savedSec : s)));
    } else {
      setSections((prev) => [...prev.filter((s) => s.id !== savedSec.id), savedSec]);
    }
  }

  async function handleToggleOverlayActive(uid: string) {
    setOverlays((prev) => prev.map((item) => (item.uid === uid ? { ...item, active: !item.active } : item)));
    try {
      await overlayActions.toggleActive(uid);
    } catch (e) {
      console.error(e);
      fetchOverlays();
    }
  }

  async function handleToggleOverlayEditable(uid: string) {
    const target = overlays.find((item) => item.uid === uid);
    if (!target) return;
    const newEditable = !target.is_editable;
    setOverlays((prev) => prev.map((item) => (item.uid === uid ? { ...item, is_editable: newEditable } : item)));

    try {
      const bgObj = typeof target.background === "string" ? JSON.parse(target.background) : (target.background || {});
      const iconObj = typeof target.icon === "string" ? JSON.parse(target.icon) : (target.icon || {});

      await overlayActions.update(uid, {
        section_id: target.section_id || "",
        overlay_id: target.overlay_id,
        source: target.source || "remote",
        order_id: target.order_id ?? 0,
        active: target.active,
        type: target.type || "",
        background: bgObj,
        icon: iconObj,
        text: target.text || "",
        text_color: target.text_color || "",
        effect: target.effect || "",
        is_editable: newEditable,
        max_lines: target.max_lines ?? 1,
        daily_start_hour: target.daily_start_hour,
        daily_end_hour: target.daily_end_hour,
        start_at: target.start_at || null,
        end_at: target.end_at || null,
      });
    } catch (e) {
      console.error(e);
      fetchOverlays();
    }
  }

  async function handleDeleteOverlay(uid: string) {
    if (!confirm("Xóa overlay này?")) return;
    setOverlays((prev) => prev.filter((item) => item.uid !== uid));
    try {
      await overlayActions.delete(uid);
    } catch (e) {
      console.error(e);
      fetchOverlays();
    }
  }

  async function handleToggleSectionActive(id: string) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
    try {
      await sectionActions.toggleActive(id);
    } catch (e) {
      console.error(e);
      fetchSections();
    }
  }

  async function handleDeleteSection(id: string) {
    if (!confirm("Xóa section này? Tất cả overlay thuộc section này sẽ bị xóa theo (CASCADE).")) return;
    setSections((prev) => prev.filter((s) => s.id !== id));
    setOverlays((prev) => prev.filter((item) => item.section_id !== id));
    try {
      await sectionActions.delete(id);
    } catch (e) {
      console.error(e);
      fetchSections();
      fetchOverlays();
    }
  }

  // Filtered dataset
  const filteredOverlays = useMemo(() => {
    return overlays.filter((item) => {
      // 1. Filter by Section
      if (selectedSection === "NONE") {
        if (item.section_id) return false;
      } else if (selectedSection !== "ALL") {
        if (item.section_id !== selectedSection) return false;
      }

      // 2. Search filter
      if (!appliedSearch) return true;
      const q = appliedSearch.toLowerCase();
      const matchId = item.overlay_id.toLowerCase().includes(q);
      const matchText = item.text ? item.text.toLowerCase().includes(q) : false;
      const matchType = item.type ? item.type.toLowerCase().includes(q) : false;
      const matchSection = item.section_id ? item.section_id.toLowerCase().includes(q) : false;
      const matchEffect = item.effect ? item.effect.toLowerCase().includes(q) : false;

      return matchId || matchText || matchType || matchSection || matchEffect;
    });
  }, [overlays, selectedSection, appliedSearch]);

  // Pagination calculation
  const totalItems = filteredOverlays.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedOverlays = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredOverlays.slice(startIdx, startIdx + pageSize);
  }, [filteredOverlays, currentPage, pageSize]);

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Overlay Studio"
          description="Quản lý Overlay và Section danh mục cho locketdio_overlays & locketdio_overlay_sections."
        />

        {/* Tab Switcher */}
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setTab("overlays")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === "overlays"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Overlays
            <Badge variant="outline" className="text-[10px] ml-1">{overlays.length}</Badge>
          </button>
          <button
            onClick={() => setTab("sections")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === "sections"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-4 w-4" />
            Sections
            <Badge variant="outline" className="text-[10px] ml-1">{sections.length}</Badge>
          </button>
        </div>

        {/* ── TAB: OVERLAYS ── */}
        {tab === "overlays" && (
          <div className="flex flex-col gap-4">
            {/* Filter Bar & Controls */}
            <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
              <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Search & Section Filter */}
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  {/* Search Input + Button */}
                  <div className="relative flex-1 min-w-[240px] max-w-md flex gap-1.5">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo overlay_id, text, type, section..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-9 pr-3"
                      />
                    </div>
                    <Button type="submit" variant="secondary" className="px-3">
                      <Search className="h-4 w-4 mr-1.5" />
                      Tìm kiếm
                    </Button>
                  </div>

                  {/* Section Filter Dropdown */}
                  <div className="flex items-center gap-1.5 min-w-[180px]">
                    <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      value={selectedSection}
                      onChange={(e) => {
                        setSelectedSection(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="ALL">Tất cả Section ({overlays.length})</option>
                      <option value="NONE">Chưa thuộc Section</option>
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reset filter button */}
                  {(appliedSearch || selectedSection !== "ALL" || searchInput) && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters} className="h-9 px-2 text-xs text-muted-foreground">
                      <X className="h-3.5 w-3.5 mr-1" /> Xóa bộ lọc
                    </Button>
                  )}
                </div>

                {/* Right controls */}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={fetchOverlays} disabled={overlayLoading}>
                    <RefreshCw className={`h-4 w-4 ${overlayLoading ? "animate-spin" : ""}`} />
                  </Button>
                  <Button type="button" onClick={() => { setEditingOverlay(null); setOpenOverlay(true); }} className="bg-primary">
                    <Plus className="h-4 w-4 mr-1.5" /> Thêm Overlay
                  </Button>
                </div>
              </form>

              {/* Active Filter Indicators */}
              {(appliedSearch || selectedSection !== "ALL") && (
                <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
                  <span>Kết quả lọc: <strong className="text-foreground">{totalItems}</strong> items</span>
                  {selectedSection !== "ALL" && (
                    <Badge variant="secondary" className="text-[10px]">
                      Section: {selectedSection}
                    </Badge>
                  )}
                  {appliedSearch && (
                    <Badge variant="secondary" className="text-[10px]">
                      Từ khóa: "{appliedSearch}"
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="overflow-x-auto">
                <Table className="min-w-[1050px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Overlay ID / Text</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Background</TableHead>
                      <TableHead>Icon</TableHead>
                      <TableHead>Type / Source</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="w-[180px]">Preview</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overlayLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="py-16 text-center text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin inline mr-2" />Đang tải dữ liệu...
                        </TableCell>
                      </TableRow>
                    ) : paginatedOverlays.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="py-16 text-center text-muted-foreground">
                          Không tìm thấy overlay nào thỏa điều kiện.
                        </TableCell>
                      </TableRow>
                    ) : paginatedOverlays.map((item, idx) => {
                      const itemIndex = (currentPage - 1) * pageSize + idx + 1;
                      const sectionObj = sections.find((s) => s.id === item.section_id);

                      return (
                        <TableRow key={item.uid}>
                          <TableCell className="text-xs text-muted-foreground font-mono">{itemIndex}</TableCell>

                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-sm font-mono text-primary">{item.overlay_id}</span>
                              {item.text && <span className="text-xs text-muted-foreground">"{item.text}"</span>}
                              {item.text_color && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="h-3 w-3 rounded-full border inline-block" style={{ background: item.text_color }} />
                                  <span className="font-mono text-[10px] text-muted-foreground">{item.text_color}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            {sectionObj ? (
                              <Badge variant="outline" className="text-xs font-mono">
                                {sectionObj.name}
                              </Badge>
                            ) : item.section_id ? (
                              <span className="text-xs font-mono text-muted-foreground">{item.section_id}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground/60 italic">—</span>
                            )}
                          </TableCell>

                          <TableCell>
                            <BgPreview bg={item.background} />
                          </TableCell>

                          <TableCell>
                            <IconPreview icon={item.icon} />
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {item.type && <Badge variant="outline" className="text-[10px] w-fit">{item.type}</Badge>}
                              <Badge variant="secondary" className="text-[10px] w-fit">{item.source || "remote"}</Badge>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground whitespace-nowrap">
                              {item.start_at && <span>▶ {formatDate(item.start_at)}</span>}
                              {item.end_at && <span>⏹ {formatDate(item.end_at)}</span>}
                              {item.daily_start_hour != null && (
                                <span>⏱ {item.daily_start_hour}h – {item.daily_end_hour}h</span>
                              )}
                              {!item.start_at && !item.daily_start_hour && <span>—</span>}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col gap-2 min-w-[125px]">
                              {/* Active toggle */}
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={item.active}
                                  onCheckedChange={() => handleToggleOverlayActive(item.uid)}
                                />
                                <span className={`text-xs font-medium ${item.active ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
                                  {item.active ? "Active" : "Tắt"}
                                </span>
                              </div>

                              {/* Editable toggle */}
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={item.is_editable}
                                  onCheckedChange={() => handleToggleOverlayEditable(item.uid)}
                                />
                                <span className={`text-[11px] ${item.is_editable ? "text-emerald-600 font-medium" : "text-muted-foreground"}`}>
                                  Editable
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Cột Preview pill ở gần cuối */}
                          <TableCell>
                            {renderThemePreview(item)}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="h-8 text-xs"
                                onClick={() => { setEditingOverlay(item); setOpenOverlay(true); }}>
                                <Edit className="h-3.5 w-3.5 mr-1" /> Sửa
                              </Button>
                              <Button size="sm" variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteOverlay(item.uid)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-muted/20">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    Hiển thị <strong>{totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> –{" "}
                    <strong>{Math.min(currentPage * pageSize, totalItems)}</strong> trong tổng số{" "}
                    <strong>{totalItems}</strong> overlays
                  </span>

                  <div className="flex items-center gap-1.5 ml-2 border-l pl-3">
                    <span>Số dòng:</span>
                    <select
                      className="h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-2">
                    Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
                  </span>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(totalPages)}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: SECTIONS ── */}
        {tab === "sections" && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Quản lý danh mục section cho bảng <code className="text-xs bg-muted px-1 rounded">locketdio_overlay_sections</code>.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchSections} disabled={sectionLoading}>
                  <RefreshCw className={`h-4 w-4 ${sectionLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button onClick={() => { setEditingSection(null); setOpenSection(true); }} className="bg-primary">
                  <Plus className="h-4 w-4 mr-1.5" /> Thêm Section
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>ID (slug)</TableHead>
                    <TableHead>Tên hiển thị</TableHead>
                    <TableHead>Badge</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : sections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                        Chưa có section nào. Hãy thêm mới.
                      </TableCell>
                    </TableRow>
                  ) : sections.map((s, idx) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm font-semibold">{s.id}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>
                        {s.badge ? (
                          <Badge variant="outline" className="text-xs">{s.badge}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.order_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={s.active}
                            onCheckedChange={() => handleToggleSectionActive(s.id)}
                          />
                          <span className={`text-xs font-semibold ${s.active ? "text-emerald-600" : "text-muted-foreground"}`}>
                            {s.active ? "Active" : "Tắt"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-8 text-xs"
                            onClick={() => { setEditingSection(s); setOpenSection(true); }}>
                            <Edit className="h-3.5 w-3.5 mr-1" /> Sửa
                          </Button>
                          <Button size="sm" variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteSection(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <OverlayDialog
        open={openOverlay}
        onOpenChange={setOpenOverlay}
        overlay={editingOverlay}
        onSuccess={handleOverlaySaved}
      />
      <SectionDialog
        open={openSection}
        onOpenChange={setOpenSection}
        section={editingSection}
        onSuccess={handleSectionSaved}
      />
    </>
  );
}
