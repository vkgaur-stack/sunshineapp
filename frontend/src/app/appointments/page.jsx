import AppointmentBooker from './AppointmentBooker';

export const metadata = {
  title: 'Book an Appointment',
  description: 'Registered beneficiaries can book a physiotherapy or health screening appointment.',
};

export default function AppointmentsPage() {
  return (
    <div>
      <section className="bg-navy text-cream py-16">
        <div className="container-page">
          <p className="text-sun-soft text-sm uppercase tracking-widest">Book an Appointment</p>
          <h1 className="font-display text-3xl md:text-4xl mt-2 max-w-2xl">
            Choose a service. Pick a slot. We&apos;ll confirm the rest.
          </h1>
        </div>
      </section>
      <section className="container-page py-14">
        <AppointmentBooker />
      </section>
    </div>
  );
}
