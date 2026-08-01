import RegisterForm from './RegisterForm';

export const metadata = {
  title: 'Register as Beneficiary',
  description: 'Register to access subsidised physiotherapy and pain relief services.',
};

export default function RegisterPage() {
  return (
    <div>
      <section className="bg-navy text-cream py-16">
        <div className="container-page">
          <p className="text-sun-soft text-sm uppercase tracking-widest">Register</p>
          <h1 className="font-display text-3xl md:text-4xl mt-2 max-w-2xl">
            Take the first step towards subsidised care.
          </h1>
          <p className="mt-3 text-cream/85 max-w-xl">
            Registration is quick and free. Once registered, you can book an
            appointment for any of our services.
          </p>
        </div>
      </section>
      <section className="container-page py-14">
        <RegisterForm />
      </section>
    </div>
  );
}
