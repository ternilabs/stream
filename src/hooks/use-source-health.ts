import { useEffect, useState } from 'preact/hooks';
import { apiClient } from '../lib/api-client';
import { getSourcesWithCache } from '../lib/queries';
import { mergeSourceHealth } from '../lib/source-health';
import { SOURCES } from '../lib/source-registry';
import { SourceWithHealth } from '../lib/types';

interface SourceHealthState {
  sources: SourceWithHealth[];
  availableSources: SourceWithHealth[];
  isLoading: boolean;
  isUnavailable: boolean;
}

const EMPTY_STATE: SourceHealthState = {
  sources: [],
  availableSources: [],
  isLoading: true,
  isUnavailable: false,
};

export function useSourceHealth(): SourceHealthState {
  const [state, setState] = useState<SourceHealthState>(EMPTY_STATE);

  useEffect(() => {
    let cancelled = false;
    setState(EMPTY_STATE);

    getSourcesWithCache(apiClient)
      .then((response) => {
        if (cancelled) return;
        const sources = mergeSourceHealth(SOURCES, response);
        setState({
          sources,
          availableSources: sources.filter((source) => source.health === 'up'),
          isLoading: false,
          isUnavailable: false,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ sources: [], availableSources: [], isLoading: false, isUnavailable: true });
      });

    return () => { cancelled = true; };
  }, []);

  return state;
}
