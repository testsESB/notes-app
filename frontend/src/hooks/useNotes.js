import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/notes.js';

export function useNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(async () => {
    const data = await api.getNotes();
    setNotes(data);
    setRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    refetch().finally(() => setLoading(false));
  }, [refetch]);

  const createNote = async (title) => {
    const note = await api.createNote({ title });
    await refetch();
    return note;
  };

  const updateNote = async (id, data) => {
    const note = await api.updateNote(id, data);
    await refetch();
    return note;
  };

  const deleteNote = async (id) => {
    await api.deleteNote(id);
    await refetch();
  };

  return { notes, loading, refreshKey, createNote, updateNote, deleteNote, refetch };
}
