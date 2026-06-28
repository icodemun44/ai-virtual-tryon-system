export default function TryOnButton({ generating, disabled, onClick, step }) {
  return (
    <button
      className={`flex items-center justify-center gap-2 w-full h-[46px] rounded-xl text-sm font-bold transition-opacity
        ${
          generating || disabled
            ? "bg-[#1A1A1A] text-[#3A3A3A] cursor-not-allowed"
            : "bg-gradient-to-br from-[#BA274A] to-[#841C26] text-[#FFE8EC] hover:opacity-90"
        }`}
      onClick={onClick}
      disabled={generating || disabled}
    >
      {generating ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-[rgba(255,232,236,0.25)] border-t-[#FFE8EC] animate-spin" />
          {step}
        </>
      ) : (
        "✦ Try It On Me"
      )}
    </button>
  );
}
