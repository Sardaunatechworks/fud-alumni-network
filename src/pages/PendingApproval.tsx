import { Link } from 'react-router-dom';
import { Clock, CheckCircle, ArrowLeft, Mail } from 'lucide-react';
import { motion } from 'motion/react';

export default function PendingApproval() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg text-center"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
          <Clock size={40} className="animate-pulse" />
        </div>
        
        <h2 className="mt-8 text-3xl font-extrabold tracking-tight text-slate-900">Application Pending</h2>
        <p className="mt-4 text-lg text-slate-600">
          Thank you for signing up as an Alumni Mentor! Your profile has been submitted for administrative review.
        </p>

        <div className="mt-10 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
          <div className="space-y-6 text-left">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Profile Received</p>
                <p className="text-sm text-slate-500">We have successfully received your registration details.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Verification in Progress</p>
                <p className="text-sm text-slate-500">Our team is verifying your graduation and professional details.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <p className="text-sm text-slate-500">
              You will receive an email notification once your account is approved. This usually takes 24-48 hours.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-primary hover:text-primary-dark">
            <ArrowLeft size={18} /> Return to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
