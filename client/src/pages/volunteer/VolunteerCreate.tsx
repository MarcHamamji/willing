import {
  User,
  Mail,
  LockKeyhole,
  Calendar,
  UserCircle,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import requestServer from '../../requestServer';

const volunteerSchema = z
  .object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    date_of_birth: z.string().min(1),
    gender: z.enum(['male', 'female', 'other']),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function VolunteerCreate() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');

  const handleSubmit = async (
    e: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    // TODO: handle frontend validation errors later
    const parseResult = volunteerSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      confirmPassword,
      date_of_birth: dateOfBirth,
      gender,
    });

    if (!parseResult.success) {
      // TODO: show validation error messages
      return;
    }

    const { confirmPassword: _, ...volunteerData } = parseResult.data;

    // TODO: rely on global error handler (no try/catch here)
    const response = await requestServer<{
      volunteer: unknown;
      token: string;
    }>('/volunteer/create', {
      method: 'POST',
      body: JSON.stringify(volunteerData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    localStorage.setItem('jwt', response.token);

    navigate('/volunteer');
  };

  return (
    <div className="hero bg-base-200 flex-grow">
      <div className="hero-content flex-col lg:flex-row-reverse gap-8">
        <div className="text-center lg:text-left">
          <h1 className="text-5xl font-bold">Volunteer Registration</h1>
          <p className="py-6">
            Fill out the form to register as a volunteer.
          </p>
        </div>

        <div className="card bg-base-100 w-full max-w-lg shadow-2xl">
          <form className="card-body" onSubmit={handleSubmit}>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="label">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                  <input
                    className="input input-bordered w-full pl-10"
                    value={firstName}
                    placeholder="First name"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFirstName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="label">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                  <input
                    className="input input-bordered w-full pl-10"
                    value={lastName}
                    placeholder="Last name"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setLastName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
              <input
                type="email"
                className="input input-bordered w-full pl-10"
                placeholder="Email"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)}
              />
            </div>

            <label className="label">Password</label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
              <input
                type="password"
                className="input input-bordered w-full pl-10"
                placeholder="Password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)}
              />
            </div>

            <label className="label">Confirm Password</label>
            <div className="relative">
              <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
              <input
                type="password"
                className="input input-bordered w-full pl-10"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="label">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                  <input
                    type="date"
                    className="input input-bordered w-full pl-10"
                    value={dateOfBirth}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setDateOfBirth(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="label">Gender</label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                  <select
                    className="select select-bordered w-full pl-10"
                    value={gender}
                    onChange={e =>
                      setGender(e.target.value as 'male' | 'female' | 'other')}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary mt-4"
              type="submit"
              disabled={!firstName || !lastName || !email || !password || !confirmPassword || !dateOfBirth || !gender}
            >
              <UserPlus size={20} />
              Register
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
