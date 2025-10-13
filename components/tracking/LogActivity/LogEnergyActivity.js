import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import CTAButton from '../../CTAButton';
import { useTracking } from '../../../context/TrackingContext';
import colors from '../../../theme/colors';
import { showFeedbackToast, showRewardToast } from '../../../utils/toast';

const ENERGY_NOTE =
  'Energy records reflect long-term consumption patterns. Their carbon footprint is applied to your overall progress, not the daily chart.';

const sanitizeCurrency = (value) => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const [whole, fractional] = cleaned.split('.');
  if (fractional === undefined) {
    return whole;
  }
  return `${whole}.${fractional.slice(0, 2)}`;
};

const LogEnergyActivity = () => {
  const router = useRouter();
  const { logEnergyActivity, energyRecord } = useTracking();

  const [electricity, setElectricity] = useState('');
  const [gas, setGas] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (energyRecord) {
      if (energyRecord.electricity) {
        setElectricity(String(energyRecord.electricity));
      }
      if (energyRecord.gas) {
        setGas(String(energyRecord.gas));
      }
    }
  }, [energyRecord]);

  const handleSave = async () => {
    const electricityValue = parseFloat(electricity) || 0;
    const gasValue = parseFloat(gas) || 0;

    if (electricityValue <= 0 && gasValue <= 0) {
      setError('Enter at least one bill amount to continue.');
      return;
    }

    try {
      const result = await logEnergyActivity({ electricityValue, gasValue });
      const pointsEarned = result?.points ?? 0;
      const awarded = result?.awarded ?? pointsEarned > 0;
      const awardError = result?.awardError;

      if (awardError) {
        showFeedbackToast({
          variant: 'info',
          title: 'Points delayed',
          message: 'We saved your energy log, but point awarding failed temporarily. We’ll retry shortly.',
        });
      } else if (!awarded) {
        showFeedbackToast({
          variant: 'info',
          title: 'Already rewarded',
          message: 'Energy points already awarded this month.',
        });
      }

      const message = awardError
        ? 'Energy usage saved. We will add your points shortly.'
        : awarded
        ? `Energy usage saved. +${pointsEarned} Carbon Points awarded.`
        : 'Energy usage saved. Monthly points already awarded.';

      showRewardToast({
        category: 'energy',
        points: pointsEarned,
        message,
        encouragement: 'Thanks for tracking your home energy habits!',
        onPrimary: () => router.replace('/(tabs)/TrackingPage'),
        onSecondary: () => router.replace('/(tabs)/ProfilePage'),
      });
    } catch (error) {
      console.error('[LogEnergyActivity] Failed to record energy activity:', error);
    }
  };

  const handleCancel = () => {
    router.push('/(tabs)/TrackingPage');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Energy Activity</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.noteCard}>
            <MaterialIcons
              name="info"
              size={18}
              color={colors.eco.blue}
              style={styles.noteIcon}
            />
            <Text style={styles.noteText}>{ENERGY_NOTE}</Text>
          </View>

          <View style={styles.energySection}>
            <View style={styles.energyHeader}>
              <MaterialIcons
                name="bolt"
                size={22}
                color={colors.eco.green[600]}
                style={styles.energyIcon}
              />
              <View>
                <Text style={styles.energyTitle}>Electricity Bill</Text>
                <Text style={styles.energySubtitle}>Monthly electricity bill</Text>
              </View>
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                value={electricity}
                onChangeText={(text) => {
                  setElectricity(sanitizeCurrency(text));
                  setError(null);
                }}
                placeholder="e.g., 120"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.energySection}>
            <View style={styles.energyHeader}>
              <MaterialIcons
                name="local-fire-department"
                size={22}
                color="#ef4444"
                style={styles.energyIcon}
              />
              <View>
                <Text style={styles.energyTitle}>Gas Bill</Text>
                <Text style={styles.energySubtitle}>Monthly gas bill</Text>
              </View>
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                value={gas}
                onChangeText={(text) => {
                  setGas(sanitizeCurrency(text));
                  setError(null);
                }}
                placeholder="e.g., 80"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <CTAButton label="Save Activity" onPress={handleSave} />
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: colors.eco.green[50],
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  noteCard: {
    backgroundColor: '#e6f0ff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  noteIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.eco.blue,
  },
  energySection: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.neutral.gray100,
  },
  energyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  energyIcon: {
    marginRight: 12,
  },
  energyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  energySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.gray50,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.neutral.gray200,
    height: 52,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 4,
  },
  actions: {
    padding: 16,
    backgroundColor: colors.background,
  },
  cancelButton: {
    backgroundColor: colors.neutral.gray200,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});

export default LogEnergyActivity;
