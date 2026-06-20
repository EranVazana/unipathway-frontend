import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { usersService } from '../services/usersService';
import AcademicScoresView from '../components/AcademicScoresView';

export default function UserAcademicScores() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [targetUser, setTargetUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    usersService.getAll()
      .then((users) => {
        if (!isMounted) return;
        const found = users.find((u) => u.userId === Number(id));
        if (!found) setError(`User ${id} not found.`);
        else setTargetUser(found);
      })
      .catch((err) => { if (isMounted) setError(err.message || 'Failed to load user.'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div className="user-academic-scores-page">
      <button type="button" onClick={() => navigate('/users')}>← Back to Users</button>
      <h1>Academic Scores — {targetUser.firstName} {targetUser.lastName}</h1>
      <AcademicScoresView targetUserId={Number(id)} />
    </div>
  );
}