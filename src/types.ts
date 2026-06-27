export type IssueCategory = 'pothole' | 'light' | 'flooding' | 'sanitation' | 'safety' | 'other';
export type IssueStatus = 'reported' | 'acknowledged' | 'in-progress' | 'resolved';
export type IssuePriority = 'low' | 'medium' | 'high';

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  isAdmin?: boolean;
}

export interface IssueReport {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  lat: number;
  lng: number;
  address: string;
  reporterName: string;
  reporterPhone?: string;
  createdAt: string;
  updatedAt: string;
  upvotes: number;
  comments: Comment[];
  photoUrl?: string;
  department?: string;
  aiResponse?: string;
  aiRemedy?: string;
}

export interface CityHealthStats {
  totalActive: number;
  resolvedCount: number;
  byCategory: Record<IssueCategory, number>;
  byPriority: Record<IssuePriority, number>;
  byStatus: Record<IssueStatus, number>;
}
