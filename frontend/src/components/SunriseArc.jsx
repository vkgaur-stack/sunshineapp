// Signature visual motif: a rising-sun arc, echoing the foundation's logo
// without reproducing it. Used sparingly — hero backdrop and footer top —
// so it reads as a considered signature, not decoration repeated everywhere.
export default function SunriseArc({ className = '' }) {
  return (
    <svg
      viewBox="0 0 1200 200"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0,200 C200,40 400,0 600,0 C800,0 1000,40 1200,200 Z"
        fill="currentColor"
      />
    </svg>
  );
}
