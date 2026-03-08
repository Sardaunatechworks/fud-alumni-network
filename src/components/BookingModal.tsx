import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorName: string;
}

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM',
  '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM'
];

const DATES = [
  { day: 'Mon', date: 'Mar 10' },
  { day: 'Tue', date: 'Mar 11' },
  { day: 'Wed', date: 'Mar 12' },
  { day: 'Thu', date: 'Mar 13' },
  { day: 'Fri', date: 'Mar 14' },
];

export default function BookingModal({ isOpen, onClose, mentorName }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<'selection' | 'success'>('selection');

  const handleBook = () => {
    if (selectedDate && selectedTime) {
      setStep('success');
    }
  };

  const resetAndClose = () => {
    setStep('selection');
    setSelectedDate(null);
    setSelectedTime(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetAndClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {step === 'selection' ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Book a Session</h3>
                    <p className="text-sm text-slate-500">with {mentorName}</p>
                  </div>
                  <button
                    onClick={resetAndClose}
                    className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Date Selection */}
                  <div>
                    <label className="mb-3 block text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Calendar size={16} className="text-indigo-600" />
                      Select Date
                    </label>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {DATES.map((d) => (
                        <button
                          key={d.date}
                          onClick={() => setSelectedDate(d.date)}
                          className={`flex min-w-[80px] flex-col items-center rounded-2xl border py-3 transition-all ${
                            selectedDate === d.date
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{d.day}</span>
                          <span className="text-sm font-bold">{d.date}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Selection */}
                  <div>
                    <label className="mb-3 block text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Clock size={16} className="text-indigo-600" />
                      Select Time Slot
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {TIME_SLOTS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                            selectedTime === t
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800 ring-1 ring-amber-200">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-xs leading-relaxed">
                      Sessions are typically 45 minutes long. You will receive a meeting link via email once the mentor confirms.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 p-6">
                  <button
                    disabled={!selectedDate || !selectedTime}
                    onClick={handleBook}
                    className="w-full rounded-2xl bg-indigo-900 py-4 text-sm font-bold text-white transition-all hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Confirm Booking
                  </button>
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Booking Requested!</h3>
                <p className="mt-2 text-slate-500">
                  Your session with {mentorName} on {selectedDate} at {selectedTime} has been requested.
                </p>
                <button
                  onClick={resetAndClose}
                  className="mt-8 w-full rounded-2xl bg-indigo-900 py-4 text-sm font-bold text-white transition-all hover:bg-indigo-800"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
