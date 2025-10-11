import { MaterialIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import colors from "../../../theme/colors";
import styles from "./styles";

const formatNumber = (value) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const formatWithPrecision = (num, precision) => {
    const str = num.toFixed(precision);
    if (!str.includes('.')) return str;
    return str.replace(/0+$/, '').replace(/\.$/, '');
  };

  if (abs >= 1_000_000_000) {
    return `${sign}${formatWithPrecision(abs / 1_000_000_000, 1)}B`;
  }

  if (abs >= 1_000_000) {
    return `${sign}${formatWithPrecision(abs / 1_000_000, 1)}M`;
  }

  if (abs >= 1_000) {
    return `${sign}${formatWithPrecision(abs / 1_000, 1)}K`;
  }

  if (abs >= 100) {
    return `${sign}${formatWithPrecision(abs, 0)}`;
  }

  if (abs >= 1) {
    return `${sign}${formatWithPrecision(abs, 1)}`;
  }

  if (abs >= 0.01) {
    return `${sign}${formatWithPrecision(abs, 2)}`;
  }

  if (abs > 0) {
    return `${sign}${formatWithPrecision(abs, 3)}`;
  }

  return '0';
};

const formatKg = (value) => `${formatNumber(value)} kg CO₂`;

const WeeklySummary = ({ total = 0, baseline = 0, previous = 0 }) => {
  const weekDelta = total - previous;
  const isIncrease = weekDelta >= 0;
  const absDelta = Math.abs(weekDelta);
  const comparisonText = previous > 0
    ? `${isIncrease ? '+' : '-'}${formatNumber(absDelta)} kg CO₂ vs last week`
    : 'Log a full week to see week-over-week trends.';
  const summaryTitle = previous > 0
    ? isIncrease
      ? 'Keep Going'
      : 'Nice Drop!'
    : 'Track Your Progress';

  return (
    <View style={styles.card}>
      {/* Header */}
      <Text style={styles.header}>Weekly Total</Text>

      {/* Total */}
      <Text style={styles.total}>{formatKg(total)}</Text>
      <Text style={styles.baseline}>
        {previous > 0 ? `Last week ${formatKg(previous)}` : `Baseline ${formatKg(baseline)}`}
      </Text>

      {/* Progress Box */}
      <View style={styles.progressBox}>
        <MaterialIcons
          name={previous > 0 && !isIncrease ? 'emoji-events' : 'insights'}
          size={20}
          color={previous > 0 && !isIncrease ? colors.eco.yellow : colors.eco.blue}
          style={styles.icon}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.progressTitle}>{summaryTitle}</Text>
          <Text style={styles.progressText}>{comparisonText}</Text>
        </View>
      </View>
    </View>
  );
};

export default WeeklySummary;
