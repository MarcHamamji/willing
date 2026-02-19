import PasswordResetCard from '../../components/PasswordResetCard';

function AdminSettings() {
  return (
    <div className="grow bg-base-200">
      <div className="p-6 md:container mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight">Change Password</h3>
            <p className="opacity-70 mt-1">Update your credentials to maintain account security.</p>
          </div>
        </div>

        <div className="max-w-xl mx-auto">
          <PasswordResetCard />
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
