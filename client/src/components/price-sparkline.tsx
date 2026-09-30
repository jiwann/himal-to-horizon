import { SERVICE_FEE_PERCENT } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

type TrendPoint = { date: string; avgPrice: number };

type Props = {
  trend: TrendPoint[];
  currency?: string;
  width?: number;
  height?: number;
};

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx.toFixed(1)} ${prev.y.toFixed(1)}, ${cpx.toFixed(1)} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  return d;
}

export function PriceSparkline({ trend, currency = "USD", width = 180, height = 52 }: Props) {
  if (!trend || trend.length < 2) return null;

  const prices = trend.map((p) => p.avgPrice);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;

  const padX = 2;
  const padTop = 6;
  const padBottom = 4;
  const w = width - padX * 2;
  const h = height - padTop - padBottom;

  const pts = trend.map((p, i) => ({
    x: padX + (i / (trend.length - 1)) * w,
    y: padTop + h - ((p.avgPrice - minP) / range) * h,
  }));

  const linePath = smoothPath(pts);
  const first = pts[0];
  const last = pts[pts.length - 1];

  const areaPath =
    linePath +
    ` L ${last.x.toFixed(1)} ${(height - padBottom).toFixed(1)}` +
    ` L ${first.x.toFixed(1)} ${(height - padBottom).toFixed(1)} Z`;

  const isRising = prices[prices.length - 1] > prices[0];
  const lineColor = isRising ? "hsl(0 70% 60%)" : "hsl(145 65% 55%)";
  const fillId = isRising ? "sparkFillRed" : "sparkFillGreen";
  const fillColorTop = isRising ? "rgba(220,80,80,0.25)" : "rgba(56,200,120,0.22)";

  const firstPrice = prices[0] * (1 + SERVICE_FEE_PERCENT);
  const lastPrice = prices[prices.length - 1] * (1 + SERVICE_FEE_PERCENT);

  return (
    <div className="flex flex-col gap-0.5">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Price trend over the last 7 days"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColorTop} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${fillId})`} />

        <path
          d={linePath}
          stroke={lineColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />

        <circle cx={first.x} cy={first.y} r="2.5" fill={lineColor} opacity="0.5" />
        <circle cx={last.x} cy={last.y} r="3" fill={lineColor} />
      </svg>

      <div className="flex justify-between text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.28)", width }}>
        <span>{formatCurrency(String(firstPrice.toFixed(2)), currency)}</span>
        <span style={{ color: lineColor, fontWeight: 700 }}>{formatCurrency(String(lastPrice.toFixed(2)), currency)}</span>
      </div>
    </div>
  );
}
