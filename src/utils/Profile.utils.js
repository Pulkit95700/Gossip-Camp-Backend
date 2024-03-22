export const generateStats = (
  followersCount,
  messageLikesCount,
  messageCount
) => {
    
  let interactiveScore = messageCount;
  let seekerScore = messageLikesCount;

  let position = "Level 0";

  if (followersCount > 1000) {
    position = "Level 3";
  } else if (followersCount > 100) {
    position = "Level 1";
  }

  return {
    interactiveScore,
    seekerScore,
    position,
  };
};
