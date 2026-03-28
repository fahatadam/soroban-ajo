/**
 * Create a unique, deterministic invite code for a group.
 * 
 * @param groupId - The group's identifier
 * @returns Formatted invite code
 */
export const generateInviteCode = (groupId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${groupId}-${timestamp}-${random}`;
};

/**
 * Create a full URL invitation link for a group.
 * 
 * @param groupId - The group's identifier
 * @param baseUrl - Optional override for the application origin
 * @returns Fully qualified invite URL
 */
export const generateInviteLink = (groupId: string, baseUrl?: string): string => {
  const code = generateInviteCode(groupId);
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/invite/${code}`;
};

/**
 * Attempt to copy text to the user's clipboard.
 * Includes a fallback for environments without `navigator.clipboard`.
 * 
 * @param text - String to copy
 * @returns True if successful
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (error) {
        textArea.remove();
        return false;
      }
    }
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

/**
 * Open the user's default email client with a pre-filled group invite.
 * 
 * @param groupName - Name of the savings group
 * @param inviteLink - Invitation URL
 * @param email - Optional recipient address
 */
export const shareViaEmail = (
  groupName: string,
  inviteLink: string,
  email?: string
): void => {
  const subject = encodeURIComponent(`Join ${groupName} on Ajo`);
  const body = encodeURIComponent(
    `You've been invited to join ${groupName} on Ajo!\n\nClick here to join: ${inviteLink}\n\nAjo is a decentralized savings group platform powered by Stellar blockchain.`
  );
  const mailtoLink = email
    ? `mailto:${email}?subject=${subject}&body=${body}`
    : `mailto:?subject=${subject}&body=${body}`;
  window.location.href = mailtoLink;
};

export const shareViaTwitter = (groupName: string, inviteLink: string): void => {
  const text = encodeURIComponent(
    `Join ${groupName} on Ajo - a decentralized savings group platform! ${inviteLink}`
  );
  window.open(
    `https://twitter.com/intent/tweet?text=${text}`,
    '_blank',
    'width=550,height=420'
  );
};

export const shareViaWhatsApp = (groupName: string, inviteLink: string): void => {
  const text = encodeURIComponent(
    `Join ${groupName} on Ajo!\n\n${inviteLink}\n\nAjo is a decentralized savings group platform.`
  );
  window.open(`https://wa.me/?text=${text}`, '_blank');
};

export const shareViaTelegram = (groupName: string, inviteLink: string): void => {
  const text = encodeURIComponent(
    `Join ${groupName} on Ajo! ${inviteLink}`
  );
  window.open(`https://t.me/share/url?url=${inviteLink}&text=${text}`, '_blank');
};

/**
 * Trigger the native Web Share API if available.
 * 
 * @param groupName - Name of the group to share
 * @param inviteLink - URL to share
 * @returns True if shared successfully
 */
export const shareViaWebShare = async (
  groupName: string,
  inviteLink: string
): Promise<boolean> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Join ${groupName} on Ajo`,
        text: `You've been invited to join ${groupName} on Ajo - a decentralized savings group platform!`,
        url: inviteLink,
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  }
  return false;
};

export interface SocialSharePayload {
  title: string;
  text: string;
  url?: string;
}

const withOptionalUrl = (text: string, url?: string): string => {
  return url ? `${text} ${url}`.trim() : text;
};

export const shareContentViaEmail = (
  payload: SocialSharePayload,
  email?: string
): void => {
  const subject = encodeURIComponent(payload.title);
  const body = encodeURIComponent(withOptionalUrl(payload.text, payload.url));
  const mailtoLink = email
    ? `mailto:${email}?subject=${subject}&body=${body}`
    : `mailto:?subject=${subject}&body=${body}`;

  window.location.href = mailtoLink;
};

export const shareContentViaTwitter = (payload: SocialSharePayload): void => {
  const text = encodeURIComponent(withOptionalUrl(payload.text, payload.url));
  window.open(
    `https://twitter.com/intent/tweet?text=${text}`,
    '_blank',
    'width=550,height=420'
  );
};

export const shareContentViaWhatsApp = (payload: SocialSharePayload): void => {
  const text = encodeURIComponent(withOptionalUrl(payload.text, payload.url));
  window.open(`https://wa.me/?text=${text}`, '_blank');
};

export const shareContentViaTelegram = (payload: SocialSharePayload): void => {
  const text = encodeURIComponent(payload.text);
  const url = encodeURIComponent(payload.url || window.location.href);
  window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
};

export const shareContentViaWebShare = async (
  payload: SocialSharePayload
): Promise<boolean> => {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: payload.title,
      text: payload.text,
      url: payload.url,
    });
    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Error sharing content:', error);
    }
    return false;
  }
};

export const buildAchievementSharePayload = (
  achievementTitle: string,
  xpReward: number,
  url?: string
): SocialSharePayload => ({
  title: `Achievement unlocked: ${achievementTitle}`,
  text: `I just unlocked \"${achievementTitle}\" and earned ${xpReward} XP on Ajo.`,
  url,
});

export const buildMilestoneSharePayload = (
  milestoneLabel: string,
  value: number,
  url?: string
): SocialSharePayload => ({
  title: `Savings milestone reached: ${milestoneLabel}`,
  text: `I just reached the ${milestoneLabel} savings milestone (${value.toFixed(2)} XLM) on Ajo.`,
  url,
});

/**
 * Parse an invite code to extract the base Group ID.
 * 
 * @param code - The full invite code
 * @returns Object with groupId or null if invalid
 */
export const parseInviteCode = (code: string): { groupId: string } | null => {
  try {
    const parts = code.split('-');
    if (parts.length >= 1) {
      return { groupId: parts[0] };
    }
    return null;
  } catch (error) {
    console.error('Failed to parse invite code:', error);
    return null;
  }
};
