import { ArrowLeft } from 'lucide-react';
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backTo: string;
  actions?: ReactNode;
};

export default function PageHeader({
  title,
  subtitle,
  backTo,
  actions,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-6 bg-base-200 -mx-6 px-6 py-4">
      <div className="flex items-center gap-3">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(backTo)}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight">{title}</h3>
          {subtitle && (
            <p className="opacity-70 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
