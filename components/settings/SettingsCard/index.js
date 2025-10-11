/**
 * @fileoverview SettingsCard component.
 * Reusable card container for SettingsPage.
 * Displays an icon, title, subtitle, and customizable right-side content.
 */

import { Pressable, Text, View } from "react-native";
import styles from "./styles";

const SettingsCard = ({
  icon,
  title,
  subtitle,
  rightContent,
  children,
  onPress,
}) => {
  const content = (
    <>
      <View style={styles.topRow}>
        <View style={styles.iconWrapper}>{icon}</View>
        <View style={styles.textWrapper}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
      </View>
      {children && <View style={styles.children}>{children}</View>}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed ? styles.cardPressed : null,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ disabled: false }}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
};

export default SettingsCard;
