import { usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { confirm } from './confirm';

export function useEditorGuard(dirty: boolean) {
  const [discarded, setDiscarded] = useState(false);
  const disable = usePreventRemove(dirty && !discarded, ({ repeat }) => {
    void confirm('Leave without saving?', 'Your unsaved changes will be discarded.', 'Discard').then(leave => {
      if (leave) { setDiscarded(true); repeat(); }
    });
  });
  return disable;
}
