import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import requestServer from '../../requestServer';
import { z } from 'zod';

// Frontend validation schema
const volunteerSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.email(),
  password: z.string().min(6),
  date_of_birth: z.string().min(1),
  gender: z.enum(['male', 'female', 'other']),
});

type VolunteerCreatePayload = z.infer<typeof volunteerSchema>;

export default function VolunteerCreate() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      date_of_birth: dateOfBirth,
      gender,
    });

    if (!parseResult.success) {
      // TODO: show validation error messages
      return;
    }

    const volunteerData: VolunteerCreatePayload = parseResult.data;

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

        <div className="card bg-base-100 w-full max-w-sm shadow-2xl">
          <form className="card-body" onSubmit={handleSubmit}>
            <label className="label">First Name</label>
            <input
              className="input w-full"
              value={firstName}
              placeholder='First name'
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFirstName(e.target.value)}
            />

            <label className="label">Last Name</label>
            <input
              className="input w-full"
              value={lastName}
              placeholder='Last name'
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setLastName(e.target.value)}
            />

            <label className="label">Email</label>
            <input
              type="email"
              className="input w-full"
              placeholder='Email'
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)}
            />

            <label className="label">Password</label>
            <input
              type="password"
              className="input w-full"
              placeholder='Password'
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)}
            />

            <label className="label">Date of Birth</label>
            <input
              type="date"
              className="input w-full"
              value={dateOfBirth}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDateOfBirth(e.target.value)}
            />

            <label className="label">Gender</label>
            <select
              className="select w-full"
              value={gender}
              onChange={e =>
                setGender(e.target.value as 'male' | 'female' | 'other')}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <button type="submit" className="btn btn-primary mt-4">
              Register
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
