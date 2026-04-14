// @ts-nocheck
import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  ExpandedState,
} from "@tanstack/react-table";
import { ChevronRight, ChevronDown, MapPin } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { datasets } from "@/data/dataLoader";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CityPincodeRow {
  id: string;          // city name or "city||pincode"
  isCity: boolean;
  city: string;
  pincode?: string;
  avgSalePrice: number;
  avgDiscount: number;
  promoRate: number;
  availabilityRate: number;
  top10Presence: number;
  rowCount: number;
  subRows?: CityPincodeRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

// ── Data builder ──────────────────────────────────────────────────────────────

interface Filters {
  platform: string;
  dateFrom: string;
  dateTo: string;
  category: string;
}

function buildTreeData(filters: Filters): CityPincodeRow[] {
  const { platform, dateFrom, dateTo, category } = filters;

  // Filter helpers
  const matchRow = (r: { platform?: string; date?: string; category?: string }) => {
    if (platform && platform !== "All Platforms" && r.platform !== platform) return false;
    if (dateFrom && r.date && r.date < dateFrom) return false;
    if (dateTo && r.date && r.date > dateTo) return false;
    if (category && category !== "All Categories" && r.category !== category) return false;
    return true;
  };

  // Group price rows by city → pincode
  const priceByCP: Record<string, Record<string, { prices: number[]; discounts: number[]; promos: number[] }>> = {};
  for (const r of datasets.priceTracking) {
    if (!matchRow(r)) continue;
    const pincode = r.pincode ?? "—";
    if (!priceByCP[r.city]) priceByCP[r.city] = {};
    if (!priceByCP[r.city][pincode]) priceByCP[r.city][pincode] = { prices: [], discounts: [], promos: [] };
    priceByCP[r.city][pincode].prices.push(r.sale_price);
    priceByCP[r.city][pincode].discounts.push(r.discount_percent);
    priceByCP[r.city][pincode].promos.push(r.promotion_flag);
  }

  // Group availability by city → pincode
  const availByCP: Record<string, Record<string, number[]>> = {};
  for (const r of datasets.availabilityTracking) {
    if (!matchRow(r)) continue;
    const pincode = r.pincode ?? "—";
    if (!availByCP[r.city]) availByCP[r.city] = {};
    if (!availByCP[r.city][pincode]) availByCP[r.city][pincode] = [];
    availByCP[r.city][pincode].push(r.availability_flag);
  }

  // Group search by city → pincode (pincode often absent in search — group to city-level)
  const searchByC: Record<string, number[]> = {};
  for (const r of datasets.searchRankTracking) {
    if (!matchRow(r)) continue;
    if (!searchByC[r.city]) searchByC[r.city] = [];
    searchByC[r.city].push(r.top10_flag ?? (r.search_rank <= 10 ? 1 : 0));
  }

  const cities = Array.from(
    new Set([
      ...Object.keys(priceByCP),
      ...Object.keys(availByCP),
    ])
  ).sort();

  return cities.map((city) => {
    // Collect all pincodes for this city
    const pincodeSet = new Set([
      ...Object.keys(priceByCP[city] ?? {}),
      ...Object.keys(availByCP[city] ?? {}),
    ]);
    const pincodes = Array.from(pincodeSet).filter((p) => p !== "—").sort();

    // Build child rows
    const subRows: CityPincodeRow[] = pincodes.map((pincode) => {
      const p = priceByCP[city]?.[pincode];
      const a = availByCP[city]?.[pincode] ?? [];
      return {
        id: `${city}||${pincode}`,
        isCity: false,
        city,
        pincode,
        avgSalePrice: p ? parseFloat(avg(p.prices).toFixed(2)) : 0,
        avgDiscount: p ? parseFloat(avg(p.discounts).toFixed(1)) : 0,
        promoRate: p ? parseFloat((avg(p.promos) * 100).toFixed(1)) : 0,
        availabilityRate: a.length ? parseFloat((avg(a) * 100).toFixed(1)) : 0,
        top10Presence: parseFloat((avg(searchByC[city] ?? []) * 100).toFixed(1)),
        rowCount: (p?.prices.length ?? 0) + a.length,
      };
    });

    // City-level aggregates (from all pincodes combined + "—" rows)
    const allPrice = priceByCP[city]
      ? Object.values(priceByCP[city]).flatMap((v) => v.prices)
      : [];
    const allDiscount = priceByCP[city]
      ? Object.values(priceByCP[city]).flatMap((v) => v.discounts)
      : [];
    const allPromo = priceByCP[city]
      ? Object.values(priceByCP[city]).flatMap((v) => v.promos)
      : [];
    const allAvail = availByCP[city]
      ? Object.values(availByCP[city]).flatMap((v) => v)
      : [];

    return {
      id: city,
      isCity: true,
      city,
      avgSalePrice: parseFloat(avg(allPrice).toFixed(2)),
      avgDiscount: parseFloat(avg(allDiscount).toFixed(1)),
      promoRate: parseFloat((avg(allPromo) * 100).toFixed(1)),
      availabilityRate: parseFloat((avg(allAvail) * 100).toFixed(1)),
      top10Presence: parseFloat((avg(searchByC[city] ?? []) * 100).toFixed(1)),
      rowCount: allPrice.length + allAvail.length,
      subRows: subRows.length > 0 ? subRows : undefined,
    };
  });
}

// ── Column helper ──────────────────────────────────────────────────────────────

const col = createColumnHelper<CityPincodeRow>();

const columns = [
  col.accessor("city", {
    header: "City / Pincode",
    cell: ({ row, getValue }) => {
      const depth = row.depth;
      return (
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: depth > 0 ? "2rem" : "0" }}
        >
          {row.getCanExpand() && (
            <button
              onClick={row.getToggleExpandedHandler()}
              className="flex items-center justify-center w-5 h-5 rounded hover:bg-muted/60 transition-colors shrink-0"
              aria-label={row.getIsExpanded() ? "Collapse" : "Expand"}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          )}
          {!row.getCanExpand() && <span className="w-5 shrink-0" />}
          <MapPin
            className={`shrink-0 ${depth === 0 ? "h-3.5 w-3.5 text-primary" : "h-3 w-3 text-muted-foreground"}`}
          />
          <span className={depth === 0 ? "font-semibold text-foreground" : "text-sm text-muted-foreground"}>
            {depth === 0 ? getValue() : row.original.pincode}
          </span>
          {depth === 0 && row.original.subRows && (
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
              {row.original.subRows.length} pincodes
            </Badge>
          )}
        </div>
      );
    },
  }),
  col.accessor("avgSalePrice", {
    header: "Avg Sale Price",
    cell: ({ getValue, row }) => (
      <span className={row.depth === 0 ? "font-medium" : "text-sm text-muted-foreground"}>
        ₹{getValue().toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </span>
    ),
  }),
  col.accessor("avgDiscount", {
    header: "Avg Discount",
    cell: ({ getValue, row }) => {
      const v = getValue();
      return (
        <span className={`${row.depth === 0 ? "font-medium" : "text-sm"} ${v > 15 ? "text-status-high" : v > 8 ? "text-status-medium" : "text-status-low"}`}>
          {v.toFixed(1)}%
        </span>
      );
    },
  }),
  col.accessor("promoRate", {
    header: "Promo Rate",
    cell: ({ getValue, row }) => {
      const v = getValue();
      return (
        <span className={`${row.depth === 0 ? "font-medium" : "text-sm"} ${v > 40 ? "text-status-high" : v > 20 ? "text-status-medium" : "text-foreground"}`}>
          {v.toFixed(1)}%
        </span>
      );
    },
  }),
  col.accessor("availabilityRate", {
    header: "Availability",
    cell: ({ getValue, row }) => {
      const v = getValue();
      return (
        <span className={`${row.depth === 0 ? "font-medium" : "text-sm"} ${v < 70 ? "text-status-high" : v < 85 ? "text-status-medium" : "text-status-low"}`}>
          {v.toFixed(1)}%
        </span>
      );
    },
  }),
  col.accessor("top10Presence", {
    header: "Top-10 Presence",
    cell: ({ getValue, row }) => {
      const v = getValue();
      return (
        <span className={`${row.depth === 0 ? "font-medium" : "text-sm"} ${v < 30 ? "text-status-high" : v < 60 ? "text-status-medium" : "text-status-low"}`}>
          {v.toFixed(1)}%
        </span>
      );
    },
  }),
];

// ── Component ─────────────────────────────────────────────────────────────────

interface CityPincodeTreeTableProps {
  filters: Filters;
}

export function CityPincodeTreeTable({ filters }: CityPincodeTreeTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const data = useMemo(() => buildTreeData(filters), [filters]);

  const table = useReactTable({
    data,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableExpanding: true,
  });

  return (
    <Card className="bg-gradient-card">
      <CardHeader>
        <CardTitle>City × Pincode Breakdown</CardTitle>
        <CardDescription>
          Expand each city to view per-pincode pricing, availability, and promo metrics.
          Click a city row's chevron to reveal child pincodes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40">
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className="text-xs uppercase tracking-wider font-semibold">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-10 text-sm text-muted-foreground">
                    No data available for the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={
                      row.depth === 0
                        ? "bg-muted/20 hover:bg-muted/40 cursor-pointer font-medium border-b border-border"
                        : "hover:bg-muted/20 bg-background"
                    }
                    onClick={row.getCanExpand() ? row.getToggleExpandedHandler() : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Top-10 Presence is city-level (search data lacks pincode granularity).
        </p>
      </CardContent>
    </Card>
  );
}
