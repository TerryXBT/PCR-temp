import { useState } from 'react';
import {
  Alert,
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

const DIET_OPTIONS = [
  {
    id: 'vegan',
    title: 'Vegan',
    description: 'Plant-based diet, excludes all animal products',
    icon: { name: 'eco', color: colors.eco.green[600] },
  },
  {
    id: 'vegetarian',
    title: 'Vegetarian',
    description: 'Includes dairy and eggs, excludes meat and fish',
    icon: { name: 'spa', color: colors.eco.green[400] },
  },
  {
    id: 'flexitarian',
    title: 'Flexitarian',
    description: 'Mostly plant-based, occasional meat or fish',
    icon: { name: 'restaurant', color: colors.eco.yellow },
  },
  {
    id: 'omnivore',
    title: 'Omnivore',
    description: 'Balanced mix of plant-based and animal products',
    icon: { name: 'dinner-dining', color: colors.eco.blue },
  },
  {
    id: 'heavy-meat',
    title: 'Heavy meat',
    description: 'High meat intake (>100 g/day red meat equivalent)',
    icon: { name: 'outdoor-grill', color: '#ef4444' },
  },
];

const sanitizeCurrency = (value) => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const [whole, fractional] = cleaned.split('.');
  if (fractional === undefined) {
    return whole;
  }
  return `${whole}.${fractional.slice(0, 2)}`;
};

const LogMealActivity = () => {
  const router = useRouter();
  const { logMealActivity } = useTracking();

  const [selectedDiet, setSelectedDiet] = useState(null);
  const [spending, setSpending] = useState('');
  const [errors, setErrors] = useState({});

  const handleSave = async () => {
    const issues = {};

    if (!selectedDiet) {
      issues.diet = 'Select a diet type to continue.';
    }

    const parsedSpending = parseFloat(spending);
    if (Number.isNaN(parsedSpending) || parsedSpending < 0) {
      issues.spending = 'Enter a valid amount (e.g. 12.50).';
    }

    if (Object.keys(issues).length > 0) {
      setErrors(issues);
      return;
    }

    try {
      const result = await logMealActivity({
        dietType: selectedDiet.id,
        dietLabel: selectedDiet.title,
        spendingValue: parsedSpending,
      });

      setErrors({});
      setSelectedDiet(null);
      setSpending('');

      const pointsEarned = result?.points ?? 0;
      const awarded = result?.awarded ?? pointsEarned > 0;
      const awardError = result?.awardError;

      if (awardError) {
        showFeedbackToast({
          variant: 'info',
          title: 'Points delayed',
          message: 'We saved your meal log, but point awarding failed temporarily. We’ll retry shortly.',
        });
      } else if (!awarded) {
        showFeedbackToast({
          variant: 'info',
          title: 'Already rewarded',
          message: 'Points already awarded for today.',
        });
      }

      const message = awardError
        ? 'Meal log saved. We will add your points shortly.'
        : awarded
        ? `You logged today’s Meals. +${pointsEarned} Carbon Points awarded.`
        : 'You logged today’s Meals. Points already awarded today.';

      showRewardToast({
        category: 'meals',
        points: pointsEarned,
        message,
        encouragement: 'Small meal swaps add up!',
        onPrimary: () => router.replace('/(tabs)/TrackingPage'),
        onSecondary: () => router.replace('/(tabs)/ProfilePage'),
      });
    } catch (error) {
      console.error('[LogMealActivity] Failed to record meal activity:', error);
      Alert.alert('Unable to save', 'Something went wrong while saving your meal activity. Please try again.');
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
        <Text style={styles.headerTitle}>Log Meal Activity</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Select Diet Type</Text>
          <Text style={styles.sectionSubtitle}>
            Required • Choose the best match for today
          </Text>

          <View style={styles.optionList}>
            {DIET_OPTIONS.map((option) => {
              const isActive = selectedDiet?.id === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionCard, isActive && styles.optionCardActive]}
                  onPress={() => {
                    setSelectedDiet(option);
                    setErrors((prev) => ({ ...prev, diet: undefined }));
                  }}
                >
                  <View style={[styles.optionIcon, { backgroundColor: `${option.icon.color}1A` }]}> 
                    <MaterialIcons name={option.icon.name} size={22} color={option.icon.color} />
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                    {isActive && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.diet ? <Text style={styles.errorText}>{errors.diet}</Text> : null}

          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Meal Spending</Text>
          <Text style={styles.sectionSubtitle}>Required • How much did you spend on food today?</Text>
          <View style={styles.spendingInputWrapper}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              value={spending}
              onChangeText={(text) => {
                setSpending(sanitizeCurrency(text));
                setErrors((prev) => ({ ...prev, spending: undefined }));
              }}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              style={styles.spendingInput}
            />
          </View>
          {errors.spending ? <Text style={styles.errorText}>{errors.spending}</Text> : null}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  sectionSpacing: {
    marginTop: 20,
  },
  optionList: {
    marginTop: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.gray100,
    marginBottom: 12,
  },
  optionCardActive: {
    borderColor: colors.eco.green[500],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionCopy: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.neutral.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.eco.green[600],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.eco.green[600],
  },
  spendingInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
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
  spendingInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  errorText: {
    marginTop: 8,
    color: colors.error,
    fontSize: 13,
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

export default LogMealActivity;
