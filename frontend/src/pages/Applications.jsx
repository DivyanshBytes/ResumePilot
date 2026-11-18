import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, Plus } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import ApplicationCard from '../components/ApplicationCard';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';

export default function Applications() {
  const [apps, setApps] = useState(null);

  useEffect(() => {
    api.get('/applications')
      .then(({ data }) =>
        setApps([...data.applications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      )
      .catch((err) => { toast.error(getErrorMessage(err)); setApps([]); });
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Applications</h1>
          <p className="mt-2 text-stone-500 dark:text-stone-400">Every job you have analysed, with its match score.</p>
        </div>
        <Link to="/applications/new"><Button><Plus className="h-4 w-4" /> Analyse a job</Button></Link>
      </div>

      <div className="mt-8">
        {apps === null ? (
          <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        ) : apps.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No applications yet"
            text="Paste a job posting and we will score your resume against it."
            action={<Link to="/applications/new"><Button>Analyse your first job</Button></Link>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {apps.map((a) => <ApplicationCard key={a._id} application={a} />)}
          </div>
        )}
      </div>
    </div>
  );
}