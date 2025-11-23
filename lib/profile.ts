export const PROFILE_KEY = "primary-profile";

export const DEFAULT_PROFILE_IMAGE: string | null = null;

export interface ProfileRecord {
  key: string;
  imageUrl: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const defaultProfileRecord: ProfileRecord = {
  key: PROFILE_KEY,
  imageUrl: DEFAULT_PROFILE_IMAGE,
};


