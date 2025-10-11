import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Pattern,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import colors from "../../../theme/colors";
import styles from "./styles";
import {
  startEndForLastNDays,
  daysBetween,
  iso,
  getTodayDateKey,
  formatShortWeekday,
  formatAxisLabel,
  formatLongDate,
} from "../../../utils/dateHelpers";

const BASELINE_COLOR = "rgba(75, 85, 99, 0.45)";
const TREND_COLOR = colors.eco.green[600];
const AREA_PATTERN_COLOR = colors.eco.green[400];
const MISSING_COLOR = "rgba(2,6,23,0.20)";

const CHART_HEIGHT = 168;
const CHART_VERTICAL_PADDING = 20;
const CHART_HORIZONTAL_PADDING = 16;
const POINT_GUTTER_LEFT = 1;
const POINT_GUTTER_RIGHT = 24;
const GRID_LINE_COUNT = 4;
const AXIS_LABEL_WIDTH = 60;
const TOOLTIP_HEIGHT = 52;
const MAX_PLOT_VALUE = 100;

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

const formatNumber = (value) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const formatWithPrecision = (num, precision) => {
    const str = num.toFixed(precision);
    if (!str.includes(".")) return str;
    return str.replace(/0+$/, "").replace(/\.$/, "");
  };

  if (abs >= 1_000_000_000)
    return `${sign}${formatWithPrecision(abs / 1_000_000_000, 1)}B`;
  if (abs >= 1_000_000)
    return `${sign}${formatWithPrecision(abs / 1_000_000, 1)}M`;
  if (abs >= 1_000) return `${sign}${formatWithPrecision(abs / 1_000, 1)}K`;
  if (abs >= 100) return `${sign}${formatWithPrecision(abs, 0)}`;
  if (abs >= 1) return `${sign}${formatWithPrecision(abs, 1)}`;
  if (abs >= 0.01) return `${sign}${formatWithPrecision(abs, 2)}`;
  if (abs > 0) return `${sign}${formatWithPrecision(abs, 3)}`;
  return "0";
};

const formatValue = (value) => `${formatNumber(value)} kg CO₂`;

const ImpactChart = ({ weeklyTrend = [], baseline = 0, total = 0 }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const RANGE_N = 7;

  // Calculate N-day window ending today
  const { start, end } = useMemo(() => startEndForLastNDays(RANGE_N), [RANGE_N]);
  const todayKey = useMemo(() => getTodayDateKey(), []);

  // Build series data for N days ending today
  const series = useMemo(() => {
    const days = daysBetween(start, end);
    const byDay = {};

    // Map existing trend data by date key
    weeklyTrend.forEach((point) => {
      const key = point.dateKey || iso(new Date(point.date || point.day));
      byDay[key] = point.value ?? 0;
    });

    return days.map((d) => {
      const key = iso(d);
      const rawValue = byDay[key];
      const value = Number.isFinite(rawValue) ? Number(rawValue) : 0;
      const isMissing = value == null;
      const isToday = key === todayKey;

      return {
        date: d,
        dateKey: key,
        label: formatShortWeekday(d),
        axisLabel: formatAxisLabel(d),
        value: isMissing ? 0 : Math.max(value, 0),
        isMissing,
        isToday,
      };
    });
  }, [start, end, todayKey, weeklyTrend]);

  const baselinePerDay = series.length ? baseline / 7 : 0; // Keep 7-day baseline logic

  const scaledSeries = useMemo(
    () =>
      series.map((point) => ({
        ...point,
        plotValue: Math.min(
          Math.max(point.value ?? 0, 0),
          MAX_PLOT_VALUE
        ),
      })),
    [series]
  );

  const hasPositiveData = scaledSeries.some((point) => (point.value ?? 0) > 0);

  const safeMax = useMemo(() => {
    const values = scaledSeries.map((point) => point.plotValue ?? 0);
    const maxValue = values.length ? Math.max(...values) : 0;
    const cappedBaseline = Math.min(
      Math.max(baselinePerDay, 0),
      MAX_PLOT_VALUE
    );
    const rawMax = Math.max(maxValue, cappedBaseline);
    const padded = rawMax * 1.15;
    return padded > 0 ? padded : 1;
  }, [baselinePerDay, scaledSeries]);

  const plotWidth = useMemo(() => {
    const leftBound = CHART_HORIZONTAL_PADDING + POINT_GUTTER_LEFT;
    const rightBound =
      containerWidth - CHART_HORIZONTAL_PADDING - POINT_GUTTER_RIGHT;
    return Math.max(rightBound - leftBound, 0);
  }, [containerWidth]);

  const plotHeight = Math.max(CHART_HEIGHT - CHART_VERTICAL_PADDING * 2, 0);

  // Calculate chart points for line - use index-based positioning for perfect alignment
  const chartPoints = useMemo(() => {
    if (!series.length) return [];

    const leftBound = CHART_HORIZONTAL_PADDING + POINT_GUTTER_LEFT;
    const step = series.length > 1 ? plotWidth / (series.length - 1) : 0;

    return scaledSeries.map((point, index) => {
      const value = point.plotValue ?? 0;
      const normalized = Math.min(value / safeMax, 1);
      const y = CHART_VERTICAL_PADDING + (1 - normalized) * plotHeight;
      const offset = series.length > 1 ? step * index : plotWidth / 2;

      return {
        ...point,
        value: point.value ?? 0,
        plotValue: value,
        x: leftBound + offset,
        y,
        normalized,
      };
    });
  }, [plotHeight, plotWidth, safeMax, scaledSeries, series.length]);

  const [activePoint, setActivePoint] = useState(null);
  const lastTapRef = useRef({ time: 0, key: null });

  const handlePointPress = useCallback(
    (point) => {
      const now = Date.now();
      const isSamePoint = lastTapRef.current.key === point.dateKey;
      const isDoubleTap = isSamePoint && now - lastTapRef.current.time < 300;

      if (isDoubleTap) {
        setActivePoint(null);
        lastTapRef.current = { time: 0, key: null };
        return;
      }

      lastTapRef.current = { time: now, key: point.dateKey };
      setActivePoint(point);
    },
    []
  );

  useEffect(() => {
    if (chartPoints.length === 0) {
      setActivePoint(null);
      return;
    }

    // Default to today's point
    const todayPoint = chartPoints.find((p) => p.isToday);
    setActivePoint((current) => {
      if (!current) return todayPoint || chartPoints[chartPoints.length - 1];
      const stillExists = chartPoints.find((p) => p.dateKey === current.dateKey);
      return stillExists ?? (todayPoint || chartPoints[chartPoints.length - 1]);
    });
  }, [chartPoints]);

  // Build smooth curved line path
  const linePath = useMemo(() => {
    if (!chartPoints.length || !hasPositiveData) {
      return "";
    }

    const smoothing = 0.22;
    const minY = CHART_VERTICAL_PADDING;
    const maxY = CHART_HEIGHT - CHART_VERTICAL_PADDING;

    const buildCommand = (point, index, points) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }

      const previous = points[index - 1];
      const prevPrev = points[index - 2] ?? previous;
      const next = points[index + 1] ?? point;

      const cp1x = previous.x + (point.x - prevPrev.x) * smoothing;
      const cp1y = clamp(
        previous.y + (point.y - prevPrev.y) * smoothing,
        minY,
        maxY
      );
      const cp2x = point.x - (next.x - previous.x) * smoothing;
      const cp2y = clamp(
        point.y - (next.y - previous.y) * smoothing,
        minY,
        maxY
      );

      return `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${point.x} ${point.y}`;
    };

    return chartPoints.map(buildCommand).join(" ");
  }, [chartPoints, hasPositiveData]);

  // Build filled area under the line
  const areaPath = useMemo(() => {
    if (!chartPoints.length || !hasPositiveData) {
      return "";
    }

    const lastPoint = chartPoints[chartPoints.length - 1];
    const firstPoint = chartPoints[0];

    return `${linePath} L ${lastPoint.x} ${
      CHART_HEIGHT - CHART_VERTICAL_PADDING
    } L ${firstPoint.x} ${CHART_HEIGHT - CHART_VERTICAL_PADDING} Z`;
  }, [chartPoints, hasPositiveData, linePath]);

  const baselineY = useMemo(() => {
    if (!plotWidth || baselinePerDay <= 0) {
      return null;
    }

    const cappedBaseline = Math.min(
      Math.max(baselinePerDay, 0),
      MAX_PLOT_VALUE
    );
    const normalized = cappedBaseline / safeMax;
    return CHART_VERTICAL_PADDING + (1 - normalized) * plotHeight;
  }, [baselinePerDay, plotHeight, plotWidth, safeMax]);

  const xAxisY = CHART_HEIGHT - CHART_VERTICAL_PADDING;

  const horizontalGridLines = useMemo(() => {
    if (!containerWidth || GRID_LINE_COUNT <= 0) {
      return [];
    }

    return Array.from({ length: GRID_LINE_COUNT + 1 }, (_, index) => {
      const ratio = GRID_LINE_COUNT ? index / GRID_LINE_COUNT : 0;
      return {
        y: CHART_VERTICAL_PADDING + ratio * plotHeight,
        isAxis: index === GRID_LINE_COUNT,
      };
    });
  }, [containerWidth, plotHeight]);

  const tooltipConfig = useMemo(() => {
    if (!activePoint || !containerWidth) {
      return null;
    }

    const dateLabel = activePoint.axisLabel ?? activePoint.label;
    const valueLabel = activePoint.value === 0 || activePoint.isMissing
      ? "No record"
      : `+${formatNumber(activePoint.value)} kg CO₂`;
    const maxChars = Math.max(dateLabel.length, valueLabel.length);
    const width = Math.max(128, maxChars * 7 + 24);

    // When active point is at the rightmost edge (Today), nudge tooltip left
    const leftBound = CHART_HORIZONTAL_PADDING + POINT_GUTTER_LEFT;
    const rightBound =
      containerWidth - CHART_HORIZONTAL_PADDING - POINT_GUTTER_RIGHT;
    const maxTooltipLeft = Math.max(rightBound - width, leftBound);
    const clampedDefaultLeft = Math.min(
      Math.max(activePoint.x - width / 2, leftBound),
      maxTooltipLeft
    );
    const isRightmost = activePoint.x >= rightBound - 8;
    const x = isRightmost ? maxTooltipLeft : clampedDefaultLeft;

    const pointerX = Math.min(
      Math.max(activePoint.x, leftBound),
      rightBound
    );
    const y = Math.max(activePoint.y - 70, 10);

    return {
      width,
      x,
      y,
      pointerX,
      dateLabel,
      valueLabel,
    };
  }, [activePoint, containerWidth]);

  const accessibleSummary = useMemo(() => {
    if (!series.length) {
      return "Weekly emissions chart with no data yet.";
    }

    const peak = series.reduce((acc, point) => {
      if (!acc || (point.value ?? 0) > (acc.value ?? 0)) {
        return point;
      }
      return acc;
    }, null);

    const totalValue = series.reduce((acc, point) => acc + (point.value ?? 0), 0);
    const average = series.length ? (totalValue / series.length).toFixed(1) : 0;
    const peakLabel = peak
      ? `${formatNumber(peak.value ?? 0)} kilograms on ${peak.axisLabel}`
      : "no peak day yet";
    return `Emissions trend for the past ${RANGE_N} days. Average ${average} kilograms per day, highest ${peakLabel}.${
      baselinePerDay > 0
        ? ` Daily target is ${formatNumber(baselinePerDay)} kilograms.`
        : ""
    }`;
  }, [baselinePerDay, series, RANGE_N]);

  // Calculate total for the displayed range
  const rangeTotal = useMemo(() => {
    return series.reduce((sum, point) => sum + (point.value ?? 0), 0);
  }, [series]);

  const rangeLabel = "Past 7 days";

  // Format date range caption (e.g., "1 Sep – 30 Sep")
  const dateRangeCaption = useMemo(() => {
    const formatDate = (date) => {
      return new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
      }).format(date);
    };
    return `${formatDate(start)} – ${formatDate(end)}`;
  }, [start, end]);

  // For 7D view, show every 2 days + Today; (30D not used but kept for safety)
  const shouldShowLabel = (index) => {
    const n = chartPoints.length;
    const idxToday = n - 1;

    if (RANGE_N === 7) {
      if (index === idxToday) {
        return true;
      }
      return index % 2 === 0;
    }
    if (RANGE_N === 30) {
      // Show every 5 days + Today (~7 ticks total)
      return index % 5 === 0 || index === idxToday;
    }
    return true;
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialIcons
            name="show-chart"
            size={22}
            color={colors.eco.green[600]}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Weekly Emissions</Text>
          <Text style={styles.subtitle}>
            {hasPositiveData
              ? "Tracking your daily CO₂ progress."
              : "Log your activities today to unlock the weekly trend."}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{rangeLabel}</Text>
          <Text style={styles.metricValue}>{formatValue(rangeTotal)}</Text>
          <Text style={styles.dateRangeCaption}>{dateRangeCaption}</Text>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <View
          style={styles.chartArea}
          onLayout={({ nativeEvent }) =>
            setContainerWidth(nativeEvent.layout.width)
          }
        >
          {containerWidth > 0 && hasPositiveData ? (
            <Svg
              width={containerWidth}
              height={CHART_HEIGHT}
              accessible
              accessibilityRole="image"
              accessibilityLabel={accessibleSummary}
            >
              <Defs>
                <LinearGradient id="fillGradient" x1="0" x2="0" y1="0" y2="1">
                  <Stop
                    offset="0%"
                    stopColor={colors.eco.green[400]}
                    stopOpacity={0.25}
                  />
                  <Stop
                    offset="100%"
                    stopColor={colors.eco.green[100]}
                    stopOpacity={0}
                  />
                </LinearGradient>
                <Pattern
                  id="trendPattern"
                  patternUnits="userSpaceOnUse"
                  width="12"
                  height="12"
                  patternTransform="rotate(45)"
                >
                  <Rect width="12" height="12" fill="transparent" />
                  <Line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="12"
                    stroke={AREA_PATTERN_COLOR}
                    strokeWidth={1}
                    opacity={0.25}
                  />
                </Pattern>
              </Defs>

              {/* Grid lines */}
              {horizontalGridLines.map(({ y, isAxis }, index) => (
                <Line
                  key={`grid-${index}`}
                  x1={CHART_HORIZONTAL_PADDING}
                  x2={containerWidth - CHART_HORIZONTAL_PADDING}
                  y1={y}
                  y2={y}
                  stroke={isAxis ? colors.neutral.gray300 : colors.neutral.gray200}
                  strokeWidth={isAxis ? 1.4 : 1}
                  strokeDasharray={isAxis ? undefined : "4 6"}
                  opacity={isAxis ? 1 : 0.7}
                />
              ))}

              {/* Tooltip vertical line */}
              {tooltipConfig && (
                <Line
                  x1={tooltipConfig.pointerX}
                  x2={tooltipConfig.pointerX}
                  y1={CHART_VERTICAL_PADDING}
                  y2={xAxisY}
                  stroke={AREA_PATTERN_COLOR}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              )}

              {/* Filled area under line */}
              <Path d={areaPath} fill="url(#fillGradient)" />
              <Path d={areaPath} fill="url(#trendPattern)" opacity={0.6} />

              {/* Line path */}
              <Path
                d={linePath}
                stroke={TREND_COLOR}
                strokeWidth={RANGE_N === 30 ? 2 : 2.6}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={RANGE_N === 30 ? 0.8 : 1}
              />

              {/* Points */}
              {chartPoints.map((point) => {
                const isActive = activePoint?.dateKey === point.dateKey;

                return (
                  <G
                    key={`point-${point.dateKey}`}
                    onPressIn={() => handlePointPress(point)}
                    accessible
                    accessibilityLabel={`${formatLongDate(point.date)}, ${formatNumber(
                      point.value
                    )} kilograms of CO₂e`}
                    accessibilityHint="Tap to view details"
                  >
                    <Rect
                      x={point.x - 22}
                      y={CHART_VERTICAL_PADDING}
                      width={44}
                      height={plotHeight}
                      fill="transparent"
                    />
                    {/* Diamond marker */}
                    <Rect
                      x={point.x - 3.2}
                      y={point.y - 3.2}
                      width={6.4}
                      height={6.4}
                      fill={point.isMissing ? MISSING_COLOR : TREND_COLOR}
                      opacity={isActive || point.isToday ? 0.85 : 0.35}
                      transform={`rotate(45 ${point.x} ${point.y})`}
                    />
                    {/* Today or active: circle indicator (only if has data) */}
                    {(isActive || (point.isToday && !point.isMissing && point.value > 0)) && (
                      <>
                        <Circle
                          cx={point.x}
                          cy={point.y}
                          r={point.isToday ? 7.5 : 6.4}
                          fill={colors.neutral.white}
                          stroke={TREND_COLOR}
                          strokeWidth={point.isToday ? 2.5 : 1.4}
                        />
                        <Circle
                          cx={point.x}
                          cy={point.y}
                          r={point.isToday ? 4.5 : 4.2}
                          fill={TREND_COLOR}
                        />
                      </>
                    )}
                    {!isActive && !(point.isToday && !point.isMissing && point.value > 0) && (
                      <>
                        {point.value === 0 || point.isMissing ? (
                          // Light grey hollow circle for zero/missing values
                          <Circle
                            cx={point.x}
                            cy={point.y}
                            r={RANGE_N === 30 ? 2.5 : 3.6}
                            fill="transparent"
                            stroke={colors.neutral.gray300}
                            strokeWidth={1.2}
                          />
                        ) : (
                          // Solid green circle for positive values
                          <Circle
                            cx={point.x}
                            cy={point.y}
                            r={RANGE_N === 30 ? 2.5 : 3.6}
                            fill={TREND_COLOR}
                          />
                        )}
                      </>
                    )}
                  </G>
                );
              })}

              {/* Tooltip with shadow */}
              {tooltipConfig && (
                <>
                  {/* Shadow layer */}
                  <Rect
                    x={tooltipConfig.x + 1}
                    y={tooltipConfig.y + 3}
                    width={tooltipConfig.width}
                    height={TOOLTIP_HEIGHT}
                    rx={12}
                    ry={12}
                    fill="rgba(0, 0, 0, 0.1)"
                  />
                  {/* Tooltip background */}
                  <Rect
                    x={tooltipConfig.x}
                    y={tooltipConfig.y}
                    width={tooltipConfig.width}
                    height={TOOLTIP_HEIGHT}
                    rx={12}
                    ry={12}
                    fill={colors.neutral.white}
                    stroke={colors.eco.green[500]}
                    strokeWidth={1.2}
                    opacity={0.98}
                  />
                  <SvgText
                    x={tooltipConfig.x + tooltipConfig.width / 2}
                    y={tooltipConfig.y + 20}
                    fill={colors.textSecondary}
                    fontSize={12}
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {tooltipConfig.dateLabel}
                  </SvgText>
                  <SvgText
                    x={tooltipConfig.x + tooltipConfig.width / 2}
                    y={tooltipConfig.y + 38}
                    fill={colors.eco.green[700]}
                    fontSize={14}
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {tooltipConfig.valueLabel}
                  </SvgText>
                </>
              )}
            </Svg>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                Time to begin your tracking journey!
              </Text>
              <Text style={styles.emptySubtitle}>
                Once you record data today, your weekly insights will appear here.
              </Text>
            </View>
          )}
        </View>

        {/* X-axis labels */}
        {containerWidth > 0 && chartPoints.length > 0 && hasPositiveData && (
          <View style={[styles.labelsRow, { width: containerWidth }]}>
            {chartPoints.map((point, index) => {
              if (!shouldShowLabel(index)) return null;

              return (
                <View
                  key={`label-${point.dateKey}`}
                  style={[
                    styles.axisLabel,
                    {
                      left: point.x - AXIS_LABEL_WIDTH / 3.7,
                    },
                  ]}
                >
                  <Text style={styles.valueLabel}>
                    {point.value > 0
                      ? `+${formatNumber(point.value)}`
                      : point.value < 0
                      ? formatNumber(point.value)
                      : "0"}
                  </Text>
                  <Text
                    style={[
                      styles.dayLabel,
                      point.isToday && styles.dayLabelToday,
                    ]}
                  >
                    {point.isToday ? "Today" : point.axisLabel ?? point.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBullet, styles.legendBulletDaily]} />
          <Text style={styles.legendLabel}>Daily CO₂ emissions</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, styles.legendLineTrend]} />
          <Text style={styles.legendLabel}>Trend</Text>
        </View>
      </View>
    </View>
  );
};

export default ImpactChart;
