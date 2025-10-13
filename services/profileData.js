// Mock data for Profile Page
// This will later be swapped with real user account data

export const profileHeader = {
  avatar: "../assets/images/react-logo.png",
  greeting: "Hi User!",
  subText: "Here’s your footprint update",
  notifications: {
    count: 1, // unread notifications
    icon: "bell",
  },
};

// export const scoreCards = {
//   baseline: {
//     icon: { name: "insights", color: "success" },
//     title: "Your Lifestyle Baseline",
//     value: 11.11,
//     unit: "tonnes CO₂/year",
//     nationalAvg: 15.3,
//     change: "46% below average",
//     changeDirection: "down", // "up" or "down"
//     progress: 0.54,
//   },
//   carbon: {
//     icon: { name: "star", color: "#FFC107" },
//     title: "Carbon Score",
//     value: 742,
//     progress: 0.74,
//     level: {
//       icon: { name: "emoji-events", color: "purple" },
//       text: "Level 2: Conscious Explorer",
//     },
//   },
// };

export const avatar = {
  gradients: {
    card: ["#A7F3D0", "#D2F1DD"], // card gradient
    circle: ["#43A047", "#66BB6A"], // avatar circle gradient
  },
  image: "../assets/images/leaves.png", // placeholder
  status: "Growing!",
  badge: { icon: "star", color: "#FFC107" },
  title: "Your Green Guardian",
  message:
    "Great job! Your avatar is growing greener every day. Keep up the sustainable choices!",
};

export const monthlySnapshot = {
  title: "Monthly Snapshot",
  performance: {
    title: "vs. Last Month",
    message: "You reduced car trips by 8 days this month",
    change: -12, // %
    direction: "down",
    color: "success",
  },
  sources: [
    {
      id: 1,
      label: "Transport",
      value: 45,
      color: "#FF7043",
      icon: "directions-car",
    },
    { id: 2, label: "Food", value: 30, color: "#4CAF50", icon: "restaurant" },
    { id: 3, label: "Energy", value: 25, color: "#FFC107", icon: "bolt" },
  ],
  tip: {
    icon: "lightbulb-outline",
    color: "#FFC107",
    text: "Try replacing 2 car trips with cycling for even better progress",
  },
};

export const profileCTA = {
  label: "View My Rewards",
  target: "/RewardsPage",
};
