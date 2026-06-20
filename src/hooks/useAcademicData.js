import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { departmentsService } from '../services/departmentsService';
import { universitiesService } from '../services/universitiesService';
import { watchlistService } from '../services/watchlistService';
import { admissionThresholdsService } from '../services/admissionThresholdsService';

export function useAcademicData() {
  const { user } = useAuth();
  const location = useLocation();

  const [departments, setDepartments] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [departmentsData, universitiesData, thresholdsData] = await Promise.all([
        departmentsService.getAll(),
        universitiesService.getAll(),
        admissionThresholdsService.getAll()
      ]);

      // Watchlist is only available for 'user' role accounts
      const watchlistData = user.userRole === 'user'
        ? await watchlistService.getByUser(user.userId)
        : [];

      setDepartments(departmentsData);
      setUniversities(universitiesData);
      setWatchlist(watchlistData);
      setThresholds(thresholdsData);
    } catch (err) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user?.userId) loadAll();
  }, [user, loadAll]);

  // Re-fetch watchlist every time the user navigates to /dashboard,
  // so academic score changes saved in Settings are always reflected immediately.
  useEffect(() => {
    if (!user?.userId || user.userRole !== 'user' || location.pathname !== '/dashboard') return;
    async function refresh() {
      try {
        const updated = await watchlistService.getByUser(user.userId);
        setWatchlist(updated);
      } catch {
        // silently ignore
      }
    }
    refresh();
  }, [location.pathname, user]);

  function universityName(universityId) {
    return universities.find((u) => u.universityId === universityId)?.name || 'Unknown university';
  }

  function departmentName(departmentId) {
    return departments.find((d) => d.departmentId === departmentId)?.majorName || 'Unknown department';
  }

  // A department can have thresholds from multiple years; resolve to the most recent one.
  function latestThreshold(departmentId) {
    const matches = thresholds.filter((t) => t.departmentId === departmentId);
    if (matches.length === 0) return null;
    return matches.reduce((latest, current) => (current.year > latest.year ? current : latest));
  }

  function isWatchlisted(departmentId) {
    return watchlist.some((w) => w.departmentId === departmentId);
  }

  async function refreshWatchlist() {
    if (user.userRole !== 'user') return;
    try {
      const updated = await watchlistService.getByUser(user.userId);
      setWatchlist(updated);
    } catch {
      // ignore
    }
  }

  async function addToWatchlist(departmentId) {
    await watchlistService.add(user.userId, departmentId);
    await refreshWatchlist();
  }

  async function updateWatchlistStatus(watchlistId, status) {
    await watchlistService.updateStatus(watchlistId, status);
    await refreshWatchlist();
  }

  async function removeFromWatchlist(watchlistId) {
    await watchlistService.remove(watchlistId);
    setWatchlist((prev) => prev.filter((w) => w.watchlistId !== watchlistId));
  }

  // Department mutations
  async function createDepartment(data) {
    await departmentsService.create(data);
    const [updatedDepts, updatedUnis] = await Promise.all([
      departmentsService.getAll(),
      universitiesService.getAll()
    ]);
    setDepartments(updatedDepts);
    setUniversities(updatedUnis);
  }

  async function updateDepartment(id, data) {
    await departmentsService.update(id, data);
    const [updatedDepts, updatedUnis] = await Promise.all([
      departmentsService.getAll(),
      universitiesService.getAll()
    ]);
    setDepartments(updatedDepts);
    setUniversities(updatedUnis);
  }

  async function deleteDepartment(id) {
    await departmentsService.delete(id);
    const [updatedDepts, updatedUnis] = await Promise.all([
      departmentsService.getAll(),
      universitiesService.getAll()
    ]);
    setDepartments(updatedDepts);
    setUniversities(updatedUnis);
  }

  // University mutations
  async function createUniversity(data) {
    await universitiesService.create(data);
    const updated = await universitiesService.getAll();
    setUniversities(updated);
  }

  async function updateUniversity(id, data) {
    await universitiesService.update(id, data);
    const updated = await universitiesService.getAll();
    setUniversities(updated);
  }

  async function deleteUniversity(id) {
    await universitiesService.delete(id);
    const updated = await universitiesService.getAll();
    setUniversities(updated);
  }

  return {
    user,
    departments,
    universities,
    watchlist,
    thresholds,
    isLoading,
    error,
    universityName,
    departmentName,
    latestThreshold,
    isWatchlisted,
    refreshWatchlist,
    addToWatchlist,
    updateWatchlistStatus,
    removeFromWatchlist,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createUniversity,
    updateUniversity,
    deleteUniversity
  };
}