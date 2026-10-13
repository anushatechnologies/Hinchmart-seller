import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics.service';

export function useAnalytics(timeRange = '30d') {
  const query = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: () => analyticsService.getAnalyticsData(timeRange),
  });

  return {
    ...query,
    analytics: query.data,
  };
}
