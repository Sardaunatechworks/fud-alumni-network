import { Link } from 'react-router-dom';
import { GraduationCap, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface font-sans text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-100 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">FUD Alumni</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-primary">
              Login
            </Link>
            <Link 
              to="/signup/student" 
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary-dark ring-1 ring-inset ring-primary/20">
                  Empowering the Next Generation
                </span>
                <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                  Connect with FUD <span className="text-primary">Excellence.</span>
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl">
                  The official FUD Alumni Mentorship Network. Bridging the gap between current students and successful alumni to foster career growth, skill development, and professional networking.
                </p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <Link
                    to="/signup/student"
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-bold text-white transition-all hover:bg-primary-dark hover:shadow-xl shadow-primary/20"
                  >
                    Sign Up as Student <ArrowRight size={20} />
                  </Link>
                  <Link
                    to="/signup/alumni"
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 py-4 text-lg font-bold text-slate-700 transition-all hover:border-primary hover:text-primary"
                  >
                    Sign Up as Alumni
                  </Link>
                </div>
                <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-primary" />
                    <span>Verified Alumni</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-primary" />
                    <span>Direct Mentorship</span>
                  </div>
                </div>
              </motion.div>
            </div>
            <div className="mt-16 lg:col-span-5 lg:mt-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative"
              >
                <div className="aspect-square rounded-3xl bg-slate-100 p-8 shadow-2xl ring-1 ring-slate-200">
                  <img
                    src="/fud-logo.jpg"
                    alt="FUD Logo"
                    className="h-full w-full rounded-2xl bg-white/50 object-contain p-2 shadow-inner mix-blend-multiply"
                  />
                  <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <img
                            key={i}
                            src={`https://picsum.photos/seed/user${i}/100/100`}
                            className="h-10 w-10 rounded-full border-2 border-white object-cover"
                            alt="User"
                            referrerPolicy="no-referrer"
                          />
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">500+ Mentors</p>
                        <p className="text-xs text-slate-500">Active this month</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-primary/5 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Built for Success</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Everything you need to navigate your career path with confidence.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Expert Guidance',
                desc: 'Get one-on-one advice from alumni who have walked the path you are on.',
                icon: <Users className="text-accent" />,
              },
              {
                title: 'Career Networking',
                desc: 'Build meaningful professional relationships that last a lifetime.',
                icon: <GraduationCap className="text-accent" />,
              },
              {
                title: 'Skill Development',
                desc: 'Identify and bridge the gap between academic learning and industry needs.',
                icon: <CheckCircle className="text-accent" />,
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md hover:ring-accent/30">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-surface py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <GraduationCap size={24} className="text-primary" />
              <span className="text-lg font-bold tracking-tight text-primary">FUD Alumni</span>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Federal University Dutse. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
