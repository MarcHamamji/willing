function VolunteerProfile() {
  const volunteerName = 'Aline Abbas';
  const avatarUrl = '';
  const nameParts = volunteerName.trim().split(/\s+/);
  const initials = nameParts
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="flex-grow bg-base-200">
      <div className="p-6 md:container mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight">Volunteer Profile</h3>
            <p className="opacity-70 mt-1">Manage your details, availability, and focus areas.</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline">Edit Profile</button>
            <button className="btn btn-primary">Save Changes</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex items-center gap-4">
                  <div className="avatar">
                    {avatarUrl
                      ? (
                          <div className="rounded-full w-20">
                            <img src={avatarUrl} alt={`${volunteerName} avatar`} />
                          </div>
                        )
                      : (
                          <div className="bg-primary text-primary-content rounded-full w-20 flex items-center justify-center">
                            <span className="text-2xl">{initials || 'V'}</span>
                          </div>
                        )}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">{volunteerName}</h4>
                    <p className="text-sm opacity-70">Beirut, Lebanon</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm opacity-80">
                    Passionate about education, environmental cleanup, and community outreach.
                    Available on weekends and weekday evenings.
                  </p>
                </div>

                <div className="divider my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="opacity-70">Email</span>
                    <span className="font-medium">aline.abbas@email.com</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="opacity-70">Phone</span>
                    <span className="font-medium">+961 71 123 456</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="opacity-70">Status</span>
                    <span className="badge badge-success">Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h5 className="font-bold text-lg">Impact Snapshot</h5>
                <div className="stats stats-vertical bg-base-100">
                  <div className="stat">
                    <div className="stat-title">Hours Volunteered</div>
                    <div className="stat-value text-primary">124</div>
                    <div className="stat-desc">+18 this month</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Events Completed</div>
                    <div className="stat-value">22</div>
                    <div className="stat-desc">3 upcoming</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Organizations</div>
                    <div className="stat-value">6</div>
                    <div className="stat-desc">2 active partnerships</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h5 className="font-bold text-lg">Skills & Causes</h5>
                <div className="mt-3">
                  <p className="text-sm opacity-70 mb-2">Top skills</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-accent">Teaching</span>
                    <span className="badge badge-accent">Event Planning</span>
                    <span className="badge badge-accent">First Aid</span>
                    <span className="badge badge-accent">Social Media</span>
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-sm opacity-70 mb-2">Preferred causes</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-secondary">Education</span>
                    <span className="badge badge-secondary">Environment</span>
                    <span className="badge badge-secondary">Youth Programs</span>
                    <span className="badge badge-secondary">Community Care</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h5 className="font-bold text-lg">Resume</h5>
                    <p className="text-sm opacity-70">View the uploaded CV and download a copy.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-outline btn-sm">Preview</button>
                    <button className="btn btn-primary btn-sm">Download</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-lg">Recent Activity</h5>
                  <button className="btn btn-ghost btn-sm">View All</button>
                </div>
                <div className="space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Coastal Cleanup</p>
                      <p className="text-xs opacity-70">Green Shores Initiative</p>
                    </div>
                    <span className="badge badge-outline">Completed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">After-School Tutoring</p>
                      <p className="text-xs opacity-70">Bright Futures</p>
                    </div>
                    <span className="badge badge-outline">Scheduled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Community Food Drive</p>
                      <p className="text-xs opacity-70">Hands Together</p>
                    </div>
                    <span className="badge badge-outline">Completed</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h5 className="font-bold text-lg">Badges</h5>
                <div className="flex flex-wrap gap-3 mt-3">
                  <div className="badge badge-primary badge-lg">100+ Hours</div>
                  <div className="badge badge-secondary badge-lg">Mentor</div>
                  <div className="badge badge-accent badge-lg">Community Builder</div>
                  <div className="badge badge-outline badge-lg">Verified</div>
                </div>
                <div className="alert alert-info mt-4">
                  <span>Complete 2 more events to unlock the “Neighborhood Hero” badge.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VolunteerProfile;
