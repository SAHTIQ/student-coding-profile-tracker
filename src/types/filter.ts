import { CollectionStatus } from './student';

export interface StudentFilterOptions {
  searchQuery: string;
  department: string;
  yearOfStudy: string;
  collectionStatus: CollectionStatus | 'all';
  sortBy: 'displayName' | 'problemsSolved' | 'activeDays' | 'contestRating' | 'lastFetchedAt';
  sortOrder: 'asc' | 'desc';
}
