import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("../services/apis/rewardsAPI", () => ({
  fetchRewardsMapping: jest.fn(),
}));

import {
  loadRewardsMapping,
  getRewardPoints,
  canAwardToday,
  markAwardedToday,
  canAwardThisMonth,
  markAwardedThisMonth,
  resetRewardStateForTests,
} from "../services/rewardsService";

import { fetchRewardsMapping } from "../services/apis/rewardsAPI";

describe("rewardsService", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await resetRewardStateForTests();
  });

  it("falls back to defaults when fetch fails", async () => {
    fetchRewardsMapping.mockRejectedValueOnce(new Error("network error"));

    const points = await getRewardPoints("transport", "daily_log");

    expect(points).toBe(5);
  });

  it("returns remote mapping when available", async () => {
    fetchRewardsMapping.mockResolvedValueOnce({
      transport: { daily_log: 9 },
    });

    await loadRewardsMapping(undefined, { forceRefresh: true });
    const points = await getRewardPoints("transport", "daily_log");

    expect(points).toBe(9);
  });

  it("prevents double daily awards", async () => {
    const today = "2025-01-31";

    expect(await canAwardToday("transport", today)).toBe(true);
    await markAwardedToday("transport", today);
    expect(await canAwardToday("transport", today)).toBe(false);
  });

  it("prevents double monthly awards", async () => {
    const month = "2025-01";

    expect(await canAwardThisMonth("energy", month)).toBe(true);
    await markAwardedThisMonth("energy", month);
    expect(await canAwardThisMonth("energy", month)).toBe(false);
  });
});
