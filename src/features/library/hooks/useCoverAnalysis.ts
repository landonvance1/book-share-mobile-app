import { useMutation } from '@tanstack/react-query';
import { coverAnalysisApi } from '../api/coverAnalysisApi';

export const useCoverAnalysis = () => {
  return useMutation({
    mutationFn: coverAnalysisApi.analyzeImage,
    retry: 1,
  });
};
