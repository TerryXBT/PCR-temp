/**
 * @fileoverview Global context for managing user data (eco_id, carbonPoints, personaStage, snapshots, etc.).
 * Syncs with AsyncStorage via StorageService and provides live updates across the app.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { updateUserPoints } from "../services/apis/userAPI";
import StorageService from "../services/storage";

const UserContext = createContext(null);

/**
 * Derives persona stage from carbon points based on levelTiers.
 * Maps 7 animation stages to the tier system:
 * - seed: Seedling (0-99)
 * - leaf: Sprout (100-249)
 * - sapling: Young Sapling (250-499)
 * - youngPlant: Eco Warrior (500-749)
 * - tree: Forest Guardian (750-999)
 * - matureTree: Blooming Grove (1000-1999)
 * - finalStage: Earth Ally+ (2000+)
 *
 * @param {number} carbonPoints - Current user carbon points.
 * @returns {"seed"|"leaf"|"sapling"|"youngPlant"|"tree"|"matureTree"|"finalStage"} Persona stage string.
 */
const derivePersonaStage = (carbonPoints) => {
  if (!carbonPoints || carbonPoints <= 99) return "seed";
  if (carbonPoints <= 249) return "leaf";
  if (carbonPoints <= 499) return "sapling";
  if (carbonPoints <= 749) return "youngPlant";
  if (carbonPoints <= 999) return "tree";
  if (carbonPoints <= 1999) return "matureTree";
  return "finalStage";
};

/**
 * UserProvider wraps the app and provides user state + updater methods.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {JSX.Element} User context provider.
 */
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  /**
   * Load user from storage on mount.
   */
  useEffect(() => {
    const loadUser = async () => {
      const stored = await StorageService.getUser();
      if (stored) {
        setUser({
          ...stored,
          personaStage: derivePersonaStage(stored.carbonPoints),
        });
      }
    };
    loadUser();
  }, []);

  /**
   * Update user both in memory (context) and storage.
   *
   * @param {object} newUser - Updated user object.
   * @returns {Promise<void>}
   */
  const updateUser = async (newUser) => {
    const withPersona = {
      ...newUser,
      personaStage: derivePersonaStage(newUser.carbonPoints),
    };
    setUser(withPersona);
    await StorageService.setUser(withPersona);
  };

  /**
   * Set carbon points value.
   *
   * @param {number} points - New carbon points value.
   * @returns {Promise<void>}
   */
  const setCarbonPoints = async (points) => {
    if (!user) return;
    const updated = {
      ...user,
      carbonPoints: points,
      personaStage: derivePersonaStage(points),
    };
    setUser(updated);
    await StorageService.setUser(updated);
  };

  /**
   * Increment carbon points and sync with API.
   *
   * @param {number} points - Points to add to the current user.
   * @returns {Promise<void>}
   */
  const addCarbonPoints = async (points) => {
    if (!user) return;
    const newTotal = (user.carbonPoints || 0) + points;
    const updated = {
      ...user,
      carbonPoints: newTotal,
      personaStage: derivePersonaStage(newTotal),
    };
    setUser(updated);
    await StorageService.setUser(updated);

    if (!__DEV__) {
      try {
        await updateUserPoints(user.eco_id, newTotal);
      } catch (err) {
        console.error(
          "[UserContext] Failed to sync carbon points with API:",
          err
        );
      }
    }
  };

  /**
   * Set monthly snapshot data.
   *
   * @param {any} snapshot - Snapshot data object.
   * @returns {Promise<void>}
   */
  const setMonthlySnapshot = async (snapshot) => {
    if (!user) return;
    await StorageService.setMonthlySnapshot(snapshot);
  };

  /**
   * Get monthly snapshot data.
   *
   * @returns {Promise<any|null>} Monthly snapshot data or null.
   */
  const getMonthlySnapshot = async () => {
    return await StorageService.getMonthlySnapshot();
  };

  /**
   * Reset user completely (logout).
   *
   * @returns {Promise<void>}
   */
  const resetUser = async () => {
    setUser(null);
    await StorageService.clearUserData();
  };

  return (
    <UserContext.Provider
      value={{
        user,
        updateUser,
        setCarbonPoints,
        addCarbonPoints,
        setMonthlySnapshot,
        getMonthlySnapshot,
        resetUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

/**
 * Hook to access user data and updater methods.
 *
 * @returns {object} User state and updater functions.
 */
export const useUser = () => useContext(UserContext);
