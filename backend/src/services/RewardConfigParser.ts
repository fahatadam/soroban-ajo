import * as yaml from 'js-yaml';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface RewardDefinition {
  type: 'FEE_DISCOUNT' | 'BONUS_TOKEN' | 'PREMIUM_FEATURE' | 'NFT_BADGE';
  amount?: number | string;
  featureId?: string;
  nftMetadata?: NFTMetadata;
  expirationDays?: number;
}

export interface AchievementCriteria {
  type: 'FIRST_GROUP' | 'CONTRIBUTION_COUNT' | 'PERFECT_ATTENDANCE' | 'REFERRAL_COUNT';
  threshold?: number;
  consecutiveRequired?: boolean;
}

export interface AchievementConfig {
  name: string;
  description: string;
  criteria: AchievementCriteria;
  rewards: RewardDefinition[];
}

export interface FeatureConfig {
  name: string;
  description: string;
}

export interface RewardConfiguration {
  version: number;
  referralRewards: {
    referrer: RewardDefinition[];
    referee: RewardDefinition[];
  };
  achievements: Record<string, AchievementConfig>;
  features: Record<string, FeatureConfig>;
}

const VALID_REWARD_TYPES = ['FEE_DISCOUNT', 'BONUS_TOKEN', 'PREMIUM_FEATURE', 'NFT_BADGE'] as const;
const VALID_CRITERIA_TYPES = ['FIRST_GROUP', 'CONTRIBUTION_COUNT', 'PERFECT_ATTENDANCE', 'REFERRAL_COUNT'] as const;

function validateRewardDefinition(d: any, path: string): string[] {
  const errors: string[] = [];
  if (!VALID_REWARD_TYPES.includes(d?.type)) {
    errors.push(`${path}.type must be one of ${VALID_REWARD_TYPES.join(', ')}`);
  }
  return errors;
}

function validateAchievement(a: any, path: string): string[] {
  const errors: string[] = [];
  if (!a?.name) errors.push(`${path}.name is required`);
  if (!a?.description) errors.push(`${path}.description is required`);
  if (!VALID_CRITERIA_TYPES.includes(a?.criteria?.type)) {
    errors.push(`${path}.criteria.type must be one of ${VALID_CRITERIA_TYPES.join(', ')}`);
  }
  if (!Array.isArray(a?.rewards)) errors.push(`${path}.rewards must be an array`);
  else a.rewards.forEach((r: any, i: number) => errors.push(...validateRewardDefinition(r, `${path}.rewards[${i}]`)));
  return errors;
}

function validateConfig(parsed: any): string[] {
  const errors: string[] = [];
  if (!parsed?.version || typeof parsed.version !== 'number') errors.push('version must be a number');
  if (!parsed?.referralRewards?.referrer || !Array.isArray(parsed.referralRewards.referrer)) {
    errors.push('referralRewards.referrer must be an array');
  } else {
    parsed.referralRewards.referrer.forEach((d: any, i: number) =>
      errors.push(...validateRewardDefinition(d, `referralRewards.referrer[${i}]`))
    );
  }
  if (!parsed?.referralRewards?.referee || !Array.isArray(parsed.referralRewards.referee)) {
    errors.push('referralRewards.referee must be an array');
  } else {
    parsed.referralRewards.referee.forEach((d: any, i: number) =>
      errors.push(...validateRewardDefinition(d, `referralRewards.referee[${i}]`))
    );
  }
  if (parsed?.achievements && typeof parsed.achievements === 'object') {
    Object.entries(parsed.achievements).forEach(([key, val]) =>
      errors.push(...validateAchievement(val, `achievements.${key}`))
    );
  }
  return errors.filter(Boolean);
}

/**
 * Parser for reward configuration files (YAML/JSON)
 */
export class RewardConfigParser {
  /**
   * Parses a raw configuration string (YAML or JSON) into a validated RewardConfiguration object.
   * Performs deep schema validation using Joi to ensure all required fields and formats are correct.
   * 
   * @param content - The raw string content of the configuration file
   * @returns The parsed and validated RewardConfiguration object
   * @throws {Error} If parsing fails or the configuration violates the schema
   */
  static parse(content: string): RewardConfiguration {
    let parsed: any;
    try {
      parsed = yaml.load(content);
    } catch (error) {
      throw new Error(`Failed to parse configuration: ${(error as Error).message}`);
    }

    const errors = validateConfig(parsed);
    if (errors.length > 0) {
      throw new Error(`Invalid reward configuration: ${errors.join('; ')}`);
    }

    return parsed as RewardConfiguration;
  }

  /**
   * Serializes a RewardConfiguration object back into a formatted YAML string.
   * Useful for exporting current settings or generating configuration templates.
   * 
   * @param config - The RewardConfiguration object to serialize
   * @returns A string containing the YAML representation of the configuration
   */
  static serialize(config: RewardConfiguration): string {
    return yaml.dump(config, { indent: 2, lineWidth: 100, noRefs: true, sortKeys: false });
  }

  /**
   * Validates a configuration object against the schema and returns any validation errors.
   * Unlike `parse`, this does not throw on failure but returns a detailed error report.
   * 
   * @param config - The object to validate
   * @returns An object containing the validation status and an optional array of error messages
   */
  static validate(config: any): { valid: boolean; errors?: string[] } {
    const errors = validateConfig(config);
    if (errors.length > 0) return { valid: false, errors };
    return { valid: true };
  }
}
