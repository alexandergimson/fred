export default function NumberInput({
  value,
  onChange,
  min = 0,
  max = 360,
  step = 1,
  className = "",
  ...props
}) {
  const base =
    "w-10 px-2 py-2 text-sm outline-none " +
    // no border or focus border here
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <input
      type="number"
      className={`${base} ${className}`}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      {...props}
    />
  );
}
