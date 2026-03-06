export default function StepsBar({ currentStep = 1 }) {
  const steps = [
    { num: 1, label: 'Details & Property' },
    { num: 2, label: 'Documents' },
    { num: 3, label: 'Review & Submit' },
  ];

  function getState(num) {
    if (num < currentStep) return 'done';
    if (num === currentStep) return 'active';
    return 'inactive';
  }

  return (
    <div className="steps-bar">
      {steps.map((step) => {
        const state = getState(step.num);
        return (
          <div key={step.num} className={`step-item ${state}`}>
            <div className={`step-dot ${state}`}>
              {state === 'done' ? '✓' : step.num}
            </div>
            <span>
              Step {step.num} — {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
