import { useEffect, useRef } from 'react';

export function useAutoSave({ dirty, title, content, noteId, onSave, delay = 1500 }) {
  const timerRef = useRef(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!dirty || !noteId) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSaveRef.current({ title, content });
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, [title, content, dirty, noteId, delay]);
}
