import { Book } from '../../books/types';

export interface CoverAnalysisSummary {
  isSuccess: boolean;
  errorMessage: string | null;
  extractedText: string;
}

/** Client-normalised response (camelCase). The API layer maps PascalCase ExactMatch → exactMatch. */
export interface CoverAnalysisResponse {
  analysis: CoverAnalysisSummary;
  matchedBooks: Book[];
  exactMatch: Book | null;
}

export interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
}
