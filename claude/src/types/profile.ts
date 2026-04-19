export interface ProfileSkill {
  id: number;
  category: string;
  category_label: string;
  name: string;
  level: number | null;
  description: string;
  order: number;
}

export interface ProfileCareer {
  id: number;
  company: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  order: number;
}

export interface ProfileLink {
  id: number;
  label: string;
  url: string;
}

export interface Profile {
  id: number;
  name: string;
  nickname: string;
  location: string;
  bio: string;
  avatar_url: string | null;
  skills: ProfileSkill[];
  careers: ProfileCareer[];
  links: ProfileLink[];
  updated_at: string;
}
